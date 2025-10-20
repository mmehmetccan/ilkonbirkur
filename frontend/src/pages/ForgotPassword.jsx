import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate,Link  } from 'react-router-dom';
import '../styles/Auth.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
      const [messageType, setMessageType] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/forgot-password`, { email });
            setMessage(response.data.message);
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
          <h2>Şifremi Unuttum</h2>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Kayıtlı E-posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Sıfırlama Bağlantısı Gönder
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
              <Link to="/login">Giriş Sayfasına Dön</Link>
              <span>|</span>
              <Link to="/register">Yeni Hesap Oluştur</Link>
            </div>
          </form>
        </div>

        {/* SAĞ TARAF - VİDEO */}
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
            💡 E-postanı gir, şifre sıfırlama bağlantını gönderelim.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;