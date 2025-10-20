// frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/login`,
        { email, password }
      );

      localStorage.setItem('token', response.data.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          _id: response.data._id,
          username: response.data.username,
        })
      );

      setMessage('Giriş başarılı!');
      setMessageType('success');
      setTimeout(() => navigate('/rooms'), 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Giriş işlemi başarısız oldu.'
      );
      setMessageType('error');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-left">
          <h1 className="login-title">Giriş Yap</h1>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Giriş Yap
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
              <Link to="/register">Kayıt Ol</Link>
              <span>|</span>
              <Link to="/forgot-password">Şifremi Unuttum</Link>
            </div>
          </form>
        </div>

        <div className="login-right">
          <div className="video-wrapper">
            <video
              src="../../public/video1.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
          <p className="video-caption">
             Kendi 11'ini kur ve rakiplerine meydan oku!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
