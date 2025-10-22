import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.put(`/api/users/reset-password/${token}`, { password });
        setMessage(response.data.message);
        setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
        setMessage(error.response?.data?.message || 'Hata oluştu.');
    }
};

    return (
        <div className="login-page-container">
            <div className="login-card">
                {/* SOL TARAF - FORM */}
                <div className="login-left">
                    <h1 className="login-title">ilkonbirkur</h1>
                    <h2>Şifre Sıfırla</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Yeni Şifre:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                   required/>
                        </div>
                        <button type="submit">Şifreyi Güncelle</button>
                    </form>
                    {message && <p>{message}</p>}
                </div>

                <div className="login-right">
                    <div className="video-wrapper">
                        <video
                            src="../../public/videos/video1.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    </div>
                    <p className="video-caption">
                        💡 E-postanı gir, şifre sıfırlama bağlantını gönderelim.
                    </p>
                </div>
            </div>

        </div>

    );
}

export default ResetPassword;
