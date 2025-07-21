import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext.jsx';
import api from '../../api';

export default function ConflictModal() {
    const { conflict, setConflict, setTasks } = useContext(AppContext);

    if (!conflict) return null;

    const { taskId, serverVersion, clientVersion } = conflict;

    const handleOverwrite = async () => {
        try {
            const payload = { ...clientVersion, version: serverVersion.version };
            delete payload._id;
            await api.put(`/api/tasks/${taskId}`, payload);
            setConflict(null);
        } catch (err) {
            alert('Failed to resolve conflict.');
        }
    };

    const handleAcceptServer = () => {
        setTasks(prev => prev.map(t => t._id === serverVersion._id ? serverVersion : t));
        setConflict(null);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Update Conflict</h2>
                <p>Another user updated this task while you were editing. Please resolve the conflict.</p>
                <div className="modal-buttons" style={{justifyContent: 'center', marginTop: '30px'}}>
                    <button className="btn-secondary" onClick={handleAcceptServer}>Accept Their Changes</button>
                    <button className="btn-primary" onClick={handleOverwrite}>Overwrite with My Changes</button>
                </div>
            </div>
        </div>
    );
}
