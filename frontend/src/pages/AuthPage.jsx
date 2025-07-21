import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, register } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await register(username, password);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="subtitle">{isLogin ? 'Log in to continue' : 'Get started with a new account'}</p>
                {error && <div className="auth-error">{error}</div>}
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
                <p style={{marginTop: '24px'}}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? ' Register' : ' Login'}
                    </span>
                </p>
            </form>
        </div>
    );
}
