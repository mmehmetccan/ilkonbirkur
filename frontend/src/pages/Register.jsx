// frontend/src/pages/Register.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: ''
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, formData);
            setMessage(response.data.message);

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            setMessage(error.response.data.message || 'Kayıt işlemi başarısız oldu.');
        }
    };

    return (
        <div className="auth-page-wrapper">

            <div className="auth-image-side">
            </div>

            <div className="auth-form-side">
                <div className="auth-container">
                    <h2>Kayıt Ol</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Kullanıcı Adı:</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Ad:</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Soyad:</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>E-posta:</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Şifre:</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                Telefon Numarası:
                                <span className="optional-note">(Zorunlu Değildir)</span>
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit">Kayıt Ol</button>
                    </form>
                    <p>
                        <Link to="/login">Zaten bir hesabım var (Giriş Yap)</Link>
                    </p>
                    {message && <p className="message">{message}</p>}
                </div>
            </div>
        </div>
    );
}

export default Register;