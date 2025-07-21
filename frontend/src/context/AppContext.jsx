import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import api from '../api';
import { AuthContext } from './AuthContext.jsx';

const AppContext = createContext();
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const AppProvider = ({ children }) => {
    const { user, token } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [conflict, setConflict] = useState(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        };

        const socket = io(SOCKET_URL);

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/tasks/board');
                setTasks(res.data.tasks);
                setUsers(res.data.users);
                setLogs(res.data.logs);
            } catch (err) {
                console.error("Failed to fetch board data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        if(user) {
            socket.emit('join', user.id);
        }

        socket.on('task:created', (newTask) => setTasks(prev => [...prev, newTask]));
        socket.on('task:updated', (updatedTask) => setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t)));
        socket.on('task:deleted', ({ taskId }) => setTasks(prev => prev.filter(t => t._id !== taskId)));
        socket.on('log:new', (newLog) => setLogs(prev => [newLog, ...prev].slice(0, 20)));
        socket.on('task:conflict', (conflictData) => setConflict(conflictData));

        return () => socket.disconnect();
    }, [token, user]);

    const value = { tasks, users, logs, loading, conflict, setConflict, setTasks };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export { AppContext };