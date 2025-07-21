import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext.jsx';
import { ClockCounterClockwise } from '@phosphor-icons/react';

export default function ActivityLog() {
    const { logs } = useContext(AppContext);
    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="activity-log-container">
            <div className="column-header"><h3><ClockCounterClockwise weight="bold" /> Activity Log</h3></div>
            <div className="activity-log">
                <ul className="log-list">
                    {logs.length > 0 ? logs.map(log => (
                        <li key={log._id} className="log-item">
                            <span className="log-user">{log.user}</span> {log.action}
                            <span className="log-time">{formatTime(log.createdAt)}</span>
                        </li>
                    )) : <p style={{textAlign: 'center', color: 'var(--font-color-secondary)'}}>No recent activity.</p>}
                </ul>
            </div>
        </div>
    );
}