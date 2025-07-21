import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import Header from '../components/layout/Header.jsx';
import Loader from '../components/layout/Loader.jsx';
import BoardColumn from '../components/board/BoardColumn.jsx';
import ActivityLog from '../components/board/ActivityLog.jsx';
import TaskModal from '../components/modals/TaskModal.jsx';
import ConflictModal from '../components/modals/ConflictModal.jsx';

export default function BoardPage() {
    const { tasks, loading } = useContext(AppContext);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const handleOpenModal = (task = null) => {
        setEditingTask(task);
        setShowTaskModal(true);
    }

    const handleCloseModal = () => {
        setEditingTask(null);
        setShowTaskModal(false);
    }

    if (loading) {
        return <Loader fullScreen={true} />;
    }

    const tasksByStatus = {
        Todo: tasks.filter(t => t.status === 'Todo'),
        'In Progress': tasks.filter(t => t.status === 'In Progress'),
        Done: tasks.filter(t => t.status === 'Done'),
    };

    return (
        <>
            {showTaskModal && <TaskModal task={editingTask} onClose={handleCloseModal} />}
            <ConflictModal />
            <Header onNewTask={() => handleOpenModal()} />
            <main className="main-content">
                <div className="board-container">
                    <BoardColumn title="To Do" status="Todo" tasks={tasksByStatus.Todo} onEditTask={handleOpenModal} />
                    <BoardColumn title="In Progress" status="In Progress" tasks={tasksByStatus['In Progress']} onEditTask={handleOpenModal} />
                    <BoardColumn title="Done" status="Done" tasks={tasksByStatus.Done} onEditTask={handleOpenModal} />
                </div>
                <ActivityLog />
            </main>
        </>
    );
}
