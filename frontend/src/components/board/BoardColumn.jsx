import React, { useState } from 'react';
import api from '../../api';
import TaskCard from './TaskCard.jsx';

export default function BoardColumn({ title, status, tasks, onEditTask }) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        const taskVersion = parseInt(e.dataTransfer.getData('taskVersion'), 10);
        const task = JSON.parse(e.dataTransfer.getData('task'));

        if (task.status === status) return;

        try {
            await api.put(`/api/tasks/${taskId}`, { status, version: taskVersion });
        } catch (err) {
            console.error('Failed to update task status', err);
        }
    };

    return (
        <div className="board-column">
            <div className="column-header">
                <h2>{title}</h2>
                <span className="task-count">{tasks.length}</span>
            </div>
            <div 
                className={`task-list ${isDragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => {e.preventDefault(); setIsDragOver(true);}}
                onDragLeave={() => setIsDragOver(false)}
            >
                {tasks.map(task => <TaskCard key={task._id} task={task} onEdit={() => onEditTask(task)} />)}
            </div>
        </div>
    );
}