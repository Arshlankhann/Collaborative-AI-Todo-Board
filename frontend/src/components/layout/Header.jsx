import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Kanban, Plus, SignOut } from '@phosphor-icons/react';

export default function Header({ onNewTask }) {
    const { user, logout } = useContext(AuthContext);
    return (
        <header className="app-header">
            <h1><Kanban color="var(--accent-color)" weight="fill" />AI Kanban Board</h1>
            <div className="header-controls">
                <div className="welcome-msg">Welcome, <span>{user?.username}</span></div>
                <button className="btn btn-primary" onClick={onNewTask}><Plus weight="bold" />New Task</button>
                <button className="btn btn-secondary" onClick={logout}><SignOut weight="bold" />Logout</button>
            </div>
        </header>
    );
}