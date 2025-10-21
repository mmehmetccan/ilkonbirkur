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
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/register`,
        formData
      );
      setMessage(response.data.message || 'Kayıt başarılı!');
      setMessageType('success');

      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Kayıt işlemi başarısız oldu.'
      );
      setMessageType('error');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* SOL TARAF - FORM */}
        <div className="login-left">
          <h1 className="login-title">Kayıt Ol</h1>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="kullanıcı adi"
                required
              />
            </div>

            <div className="form-group">
              <label>Ad</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Adınız"
                required
              />
            </div>

            <div className="form-group">
              <label>Soyad</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Soyadınız"
                required
              />
            </div>

            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ornek@mail.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Telefon Numarası <span className="optional-note">(Zorunlu değil)</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="05xx xxx xx xx"
              />
            </div>

            <button type="submit" className="login-btn">
              Kayıt Ol
            </button>

            {message && (
              <p
                className={`login-message ${
                  messageType === 'success' ? 'success' : 'error'
                }`}
              >
                {message}
              </p>
            )}

            <div className="login-links">
              <Link to="/login">Zaten bir hesabım var (Giriş Yap)</Link>
            </div>
          </form>
        </div>

        {/* SAĞ TARAF - VİDEO */}
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
            Kayıt ol, kendi 11’ini kur ve oyuna hemen başla!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
