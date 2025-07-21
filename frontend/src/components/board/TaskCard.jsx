import React, { useState } from 'react';
import api from '../../api';
import { Sparkle, UserPlus, PencilSimple, Trash, SpinnerGap } from '@phosphor-icons/react';

export default function TaskCard({ task, onEdit }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const assignedTo = task.assignedUser?.username || 'Unassigned';

    const handleDragStart = (e) => {
        e.dataTransfer.setData('taskId', task._id);
        e.dataTransfer.setData('taskVersion', task.version);
        e.dataTransfer.setData('task', JSON.stringify(task));
        setTimeout(() => e.target.classList.add('dragging'), 0);
    };
    
    const handleDelete = async () => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/api/tasks/${task._id}`);
            } catch (err) {
                alert('Failed to delete task.');
            }
        }
    };
    
    const handleSmartAssign = async () => {
        try {
            await api.post(`/api/tasks/${task._id}/smart-assign`);
        } catch (err) {
            alert('Failed to smart assign task.');
        }
    };

    const handleSuggestSubtasks = async () => {
        setIsGenerating(true);
        try {
            await api.post(`/api/tasks/${task._id}/suggest-subtasks`);
        } catch (err) {
            alert('Failed to get AI suggestions.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="task-card" draggable onDragStart={handleDragStart} onDragEnd={(e) => e.target.classList.remove('dragging')}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <div className="task-footer">
                <div className="task-meta">
                    <div className={`pill priority-${task.priority}`}>{task.priority}</div>
                    <div className="assigned-user">{assignedTo}</div>
                </div>
                <div className="task-actions">
                     <button title="Suggest Sub-tasks" className="icon-btn ai-btn" onClick={handleSuggestSubtasks} disabled={isGenerating}>
                        {isGenerating ? <SpinnerGap size={20} className="ph-spin" /> : <Sparkle size={20} weight="bold" />}
                    </button>
                    <button title="Smart Assign" className="icon-btn" onClick={handleSmartAssign}><UserPlus size={20} weight="bold" /></button>
                    <button title="Edit Task" className="icon-btn" onClick={onEdit}><PencilSimple size={20} weight="bold" /></button>
                    <button title="Delete Task" className="icon-btn delete-btn" onClick={handleDelete}><Trash size={20} weight="bold" /></button>
                </div>
            </div>
        </div>
    );
}