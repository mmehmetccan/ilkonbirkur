// frontend/src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Profile.css';

function Profile() {
    const [user, setUser] = useState({});
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [isPasswordChange, setIsPasswordChange] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailChangeStep, setEmailChangeStep] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setMessage('Giriş yapmalısınız.');
                    return;
                }
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data);
                setFormData({
                    username: res.data.username,
                    email: res.data.email,
                    firstName: res.data.firstName,
                    lastName: res.data.lastName,
                    phoneNumber: res.data.phoneNumber,
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                });
            } catch (err) {
                console.error(err);
                setMessage(err.response?.data?.message || 'Profil bilgileri alınamadı.');
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendConfirmationLink = async () => {
        setMessage('');
        if (!newEmail || newEmail === user.email) {
            setMessage('Lütfen geçerli bir yeni e-posta adresi girin.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/request-email-change`, { newEmail }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage(res.data.message + ' Lütfen gelen kutunuzu kontrol edin.');
            setEmailChangeStep(3); // Link gönderildi durumuna geç

        } catch (error) {
            setMessage(error.response?.data?.message || 'Onay linki gönderilirken bir hata oluştu.');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (isPasswordChange) {
            if (!formData.currentPassword) {
                setMessage('Mevcut şifrenizi girmelisiniz.');
                return;
            }
            if (!formData.newPassword || !formData.confirmNewPassword) {
                setMessage('Yeni şifrenizi iki kez girmelisiniz.');
                return;
            }
            if (formData.newPassword !== formData.confirmNewPassword) {
                setMessage('Yeni şifreler eşleşmiyor.');
                return;
            }
            if (formData.newPassword.length < 6) {
                setMessage('Yeni şifre en az 6 karakter olmalıdır.');
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');

            const payload = {
                username: formData.username,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                ...(isPasswordChange && {
                    currentPassword: formData.currentPassword,
                    password: formData.newPassword
                })
            };

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(res.data);
            setFormData(prev => ({
                ...prev,
                username: res.data.username,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                phoneNumber: res.data.phoneNumber,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            }));
            setIsPasswordChange(false);
            setMessage(res.data.message || 'Profil bilgileri başarıyla güncellendi.');

        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || 'Güncelleme başarısız oldu.');
        }
    };

    return (
        <div className="auth-container profile-container">
            <h2 className="form-title">Hesap Bilgilerini Düzenle</h2>
            <form onSubmit={handleSubmit} className="auth-form">

                <div className="form-section">
                    <h3 className="section-title">Temel Bilgiler</h3>
                    <div className="form-group">
                        <label>Kullanıcı Adı:</label>
                        <input className="form-input" name="username" value={formData.username || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>İsim:</label>
                        <input className="form-input" name="firstName" value={formData.firstName || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Soyisim:</label>
                        <input className="form-input" name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Telefon:</label>
                        <input className="form-input" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-section email-change-section">
                    <h3 className="section-title">E-posta Adresi</h3>
                    <p className="current-email">Mevcut E-posta: <strong>{user.email || 'Yükleniyor...'}</strong></p>

                    {emailChangeStep === 0 && (
                        <button type="button" className="btn-secondary" onClick={() => setEmailChangeStep(1)}>
                            E-posta Değiştir
                        </button>
                    )}

                    {emailChangeStep === 1 && (
                        <div className="email-input-group">
                            <div className="form-group">
                                <label>Yeni E-posta:</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="button" className="btn-primary" onClick={handleSendConfirmationLink}>
                                Onay Linki Gönder
                            </button>
                            <button type="button" className="btn-secondary btn-small" onClick={() => setEmailChangeStep(0)}>
                                İptal
                            </button>
                        </div>
                    )}

                    {emailChangeStep === 3 && (
                         <div className="email-sent-message">
                            <p className="success-message">Onay linki **{newEmail}** adresine gönderildi. Lütfen gelen kutunuzu kontrol edin ve linke tıklayarak e-posta adresinizi doğrulayın.</p>
                            <button type="button" className="btn-secondary btn-small" onClick={() => setEmailChangeStep(0)}>
                                Bitir
                            </button>
                        </div>
                    )}
                </div>

                <div className="form-section password-change-section">
                    <h3 className="section-title">Şifre</h3>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setIsPasswordChange(!isPasswordChange)}
                    >
                        {isPasswordChange ? 'Şifre Değiştirmeyi İptal Et' : 'Şifre Değiştir'}
                    </button>

                    {isPasswordChange && (
                        <>
                            <div className="form-group">
                                <label>Mevcut Şifre:</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword || ''}
                                    onChange={handleChange}
                                    required={isPasswordChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Yeni Şifre:</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword || ''}
                                    onChange={handleChange}
                                    required={isPasswordChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Yeni Şifre (Tekrar):</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="confirmNewPassword"
                                    value={formData.confirmNewPassword || ''}
                                    onChange={handleChange}
                                    required={isPasswordChange}
                                />
                            </div>
                        </>
                    )}
                </div>

                {message && <p className={`message ${message.includes('başarılı') || message.includes('gönderildi') ? 'success' : 'error'}`}>{message}</p>}

                <button type="submit" className="btn-primary submit-button">
                    Temel Bilgileri Güncelle
                </button>
            </form>
        </div>
    );
}

export default Profile;