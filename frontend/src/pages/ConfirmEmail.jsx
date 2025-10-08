// frontend/src/pages/ConfirmEmail.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/Auth.css'; // Stil dosyanızı kullanın

function ConfirmEmail() {
    const { token } = useParams(); // URL'deki token'ı alır
    const [status, setStatus] = useState('Yükleniyor...');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('Hata');
                setMessage('Doğrulama tokeni URL\'de bulunamadı.');
                return;
            }

            try {
                // Backend'deki GET /api/users/confirm-email/:token endpoint'ine istek at
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/confirm-email/${token}`);

                setStatus('Başarılı');
                setMessage(res.data.message || 'E-posta adresiniz başarıyla güncellendi.');

                // Başarılı olursa kullanıcıyı yönlendirmek isteyebilirsiniz
                // setTimeout(() => { window.location.href = '/profile'; }, 3000);

            } catch (error) {
                setStatus('Hata');
                setMessage(error.response?.data?.message || 'E-posta doğrulama başarısız oldu. Token geçersiz veya süresi dolmuş olabilir.');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="auth-container" style={{ textAlign: 'center', padding: '50px' }}>
            <h2 className="form-title">{status}</h2>
            {status === 'Yükleniyor...' && <p>E-posta adresiniz doğrulanıyor, lütfen bekleyin...</p>}

            {/* Başarılı veya Hata mesajı */}
            {message && <p className={status === 'Başarılı' ? 'message success' : 'message error'}>{message}</p>}

            {/* Profil sayfasına geri dönme butonu */}
            {(status !== 'Yükleniyor...' && message) && (
                <a href="/profile" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
                    Profil Sayfasına Dön
                </a>
            )}
        </div>
    );
}

export default ConfirmEmail;