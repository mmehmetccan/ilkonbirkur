import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.put(`http://localhost:3000/api/users/reset-password/${token}`, { password });
        setMessage(response.data.message);
        setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
        setMessage(error.response?.data?.message || 'Hata oluştu.');
    }
};

    return (
        <div className="auth-container">
            <h2>Şifre Sıfırla</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Yeni Şifre:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Şifreyi Güncelle</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default ResetPassword;
