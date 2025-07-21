import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext.jsx';
import api from '../../api';
import { Sparkle } from '@phosphor-icons/react';

export default function TaskModal({ task, onClose }) {
    const { tasks } = useContext(AppContext);
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [priority, setPriority] = useState(task?.priority || 'Medium');
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDesc = async () => {
        if (!title.trim()) {
            setError('Please provide a title first.');
            return;
        }
        setError('');
        setIsGenerating(true);
        try {
            const res = await api.post('/api/tasks/generate-description', { title });
            setDescription(res.data.description);
        } catch (err) {
            setError('Failed to get AI suggestion.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const trimmedTitle = title.trim();
        if (!trimmedTitle) { setError('Title is required.'); return; }
        if (['todo', 'in progress', 'done'].includes(trimmedTitle.toLowerCase())) { setError('Task title cannot be a column name.'); return; }
        const isDuplicate = tasks.some(t => t._id !== task?._id && t.title.toLowerCase() === trimmedTitle.toLowerCase());
        if (isDuplicate) { setError('Task title must be unique.'); return; }

        const taskData = { title: trimmedTitle, description, priority, version: task?.version };

        try {
            if (task) {
                await api.put(`/api/tasks/${task._id}`, taskData);
            } else {
                await api.post('/api/tasks', taskData);
            }
            onClose();
        } catch (err) {
            if (err.response?.status !== 409) {
                setError(err.response?.data?.message || 'Failed to save task.');
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{task ? 'Edit Task' : 'New Task'}</h2>
                {error && <p className="auth-error">{error}</p>}
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                        <label>Priority</label>
                        <select value={priority} onChange={e => setPriority(e.target.value)}>
                            <option>Low</option> <option>Medium</option> <option>High</option>
                        </select>
                    </div>
                    <div className="modal-buttons">
                        <button type="button" className="btn-ai" onClick={handleGenerateDesc} disabled={isGenerating || !title.trim()}>
                            <Sparkle weight="fill" />
                            {isGenerating ? 'Generating...' : 'Generate Desc'}
                        </button>
                        <div className="right-buttons">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary">{task ? 'Save Changes' : 'Create Task'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}