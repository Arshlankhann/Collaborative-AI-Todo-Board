// server/routes/taskRoutes.js
const express = require('express');
const auth = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const User = require('../models/User');
const ActionLog = require('../models/ActionLog');
const router = express.Router();

const createAndBroadcastLog = async (io, user, action) => {
    const log = new ActionLog({ user: user.username, action });
    await log.save();
    io.emit('log:new', log);
};

const callGeminiAPI = async (prompt) => {
    console.log("Calling genuine Gemini API with prompt:", prompt);
    const apiKey = process.env.API_KEY; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        }

        throw new Error("Invalid response structure from API");

    } catch (error) {
        console.error("Gemini API call error:", error);
        return "Sorry, the AI feature is currently unavailable.";
    }
};



router.get('/board', auth, async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedUser', 'username').sort({ createdAt: 'desc' });
        const users = await User.find().select('-password');
        const logs = await ActionLog.find().sort({ createdAt: -1 }).limit(20);
        res.json({ tasks, users, logs });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', auth, async (req, res) => {
    const { title, description, priority } = req.body;
    const io = req.app.get('socketio');

    try {
        const currentUser = await User.findById(req.user.id);
        const existingTask = await Task.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
        if (existingTask) return res.status(400).json({ message: 'Task title must be unique.' });
        if (['todo', 'in progress', 'done'].includes(title.toLowerCase())) return res.status(400).json({ message: 'Task title cannot be a column name.' });

        const newTask = new Task({ title, description, priority });
        const task = await newTask.save();
        const populatedTask = await Task.findById(task._id).populate('assignedUser', 'username');

        await createAndBroadcastLog(io, currentUser, `created task "${task.title}"`);
        io.emit('task:created', populatedTask);
        res.status(201).json(populatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/:id', auth, async (req, res) => {
    const { title, description, priority, status, assignedUser, version } = req.body;
    const io = req.app.get('socketio');

    try {
        const currentUser = await User.findById(req.user.id);
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.version !== version) {
            io.to(req.user.id).emit('task:conflict', { taskId: task._id, serverVersion: task, clientVersion: { ...req.body, _id: task._id } });
            return res.status(409).json({ message: 'Conflict detected' });
        }

        const originalTask = { ...task.toObject() };

        task.title = title ?? task.title;
        task.description = description ?? task.description;
        task.priority = priority ?? task.priority;
        task.status = status ?? task.status;
        task.assignedUser = assignedUser === '' ? null : (assignedUser ?? task.assignedUser);
        task.version += 1;

        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id).populate('assignedUser', 'username');

        if (originalTask.status !== populatedTask.status) {
            await createAndBroadcastLog(io, currentUser, `moved task "${populatedTask.title}" to ${populatedTask.status}`);
        } else {
            await createAndBroadcastLog(io, currentUser, `updated task "${populatedTask.title}"`);
        }

        io.emit('task:updated', populatedTask);
        res.json(populatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/:id', auth, async (req, res) => {
    const io = req.app.get('socketio');
    try {
        const currentUser = await User.findById(req.user.id);
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await task.deleteOne();

        await createAndBroadcastLog(io, currentUser, `deleted task "${task.title}"`);
        io.emit('task:deleted', { taskId: req.params.id });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/:id/smart-assign', auth, async (req, res) => {
    const io = req.app.get('socketio');
    try {
        const currentUser = await User.findById(req.user.id);
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const userTaskCounts = await Task.aggregate([
            { $match: { status: { $ne: 'Done' }, assignedUser: { $ne: null } } },
            { $group: { _id: '$assignedUser', count: { $sum: 1 } } }
        ]);

        const allUsers = await User.find().select('_id username');
        const usersWithCounts = allUsers.map(user => {
            const found = userTaskCounts.find(count => count._id.equals(user._id));
            return { userId: user._id, username: user.username, count: found ? found.count : 0 };
        });

        const userToAssign = usersWithCounts.sort((a, b) => a.count - b.count)[0];
        if (!userToAssign) return res.status(400).json({ message: 'No users available' });

        task.assignedUser = userToAssign.userId;
        task.version += 1;

        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id).populate('assignedUser', 'username');

        await createAndBroadcastLog(io, currentUser, `smart-assigned task "${populatedTask.title}" to ${userToAssign.username}`);
        io.emit('task:updated', populatedTask);
        res.json(populatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.post('/generate-description', auth, async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Title is required.' });
    }
    try {
        const prompt = `Generate a concise, one-paragraph description for a to-do list task titled "${title}". Focus on the key action or goal.`;
        const description = await callGeminiAPI(prompt);
        res.json({ description });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('AI service error');
    }
});

router.post('/:id/suggest-subtasks', auth, async (req, res) => {
    const io = req.app.get('socketio');
    try {
        const currentUser = await User.findById(req.user.id);
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const prompt = `Based on the task titled "${task.title}" with the description "${task.description}", generate a short markdown checklist of 3-5 sub-tasks. Output only the markdown checklist. For example: \n- [ ] Sub-task 1\n- [ ] Sub-task 2`;
        const subtasks = await callGeminiAPI(prompt);

        task.description += `\n\n**Suggested Sub-tasks:**\n${subtasks}`;
        task.version += 1;

        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id).populate('assignedUser', 'username');

        await createAndBroadcastLog(io, currentUser, `added AI sub-tasks to "${populatedTask.title}"`);
        io.emit('task:updated', populatedTask);
        res.json(populatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('AI service error');
    }
});


module.exports = router;
