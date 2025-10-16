// frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css'

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [messageType, setMessageType] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, { email, password });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
              _id: response.data._id,
              username: response.data.username
            }));
        setMessage('Giriş başarılı!');
        setMessageType('success');
             setTimeout(() => navigate('/rooms'), 1000);
        } catch (error) {
        setMessage(error.response?.data?.message || 'Giriş işlemi başarısız oldu.');
        setMessageType('error');
             }
    };

    return (
        <div className="auth-page-wrapper">

            <div className="auth-image-side">
            </div>

            <div className="auth-form-side">
                <div className="auth-container">
                    <h2>Giriş Yap</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>E-posta:</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Şifre:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit">Giriş Yap</button>
                    </form>
                    <p>
                        <Link to="/register">Kayıt Ol</Link> | <Link to="/forgot-password">Şifremi Unuttum</Link>
                    </p>
                    {message && <p className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>{message}</p>}
                </div>
            </div>
        </div>
    );
}

export default Login;