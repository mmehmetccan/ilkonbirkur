// frontend/src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Stil dosyanızı (örn: Auth.css veya Profile.css) projenize uygun şekilde import edin
import '../styles/Profile.css';

function Profile() {
    const [user, setUser] = useState({});
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [isPasswordChange, setIsPasswordChange] = useState(false); // Şifre değiştirme alanlarını gizle/göster
    const [newEmail, setNewEmail] = useState('');
    // 0: Kapalı, 1: Yeni Email Girişi, 3: Link Gönderildi (Doğrulama Bekleniyor)
    const [emailChangeStep, setEmailChangeStep] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                // Token yoksa kullanıcıyı login sayfasına yönlendirmeniz gerekebilir
                if (!token) {
                    setMessage('Giriş yapmalısınız.');
                    return;
                }
                const res = await axios.get('http://localhost:3000/api/users/profile', {
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

    // E-posta Onay Linki Gönderme İşlemi
    const handleSendConfirmationLink = async () => {
        setMessage('');
        if (!newEmail || newEmail === user.email) {
            setMessage('Lütfen geçerli bir yeni e-posta adresi girin.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Backend'deki mevcut '/request-email-change' endpoint'i kullanılır
            const res = await axios.post('http://localhost:3000/api/users/request-email-change', { newEmail }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Başarılı olduğunda kullanıcıya gelen kutusunu kontrol etmesini söyle
            setMessage(res.data.message + ' Lütfen gelen kutunuzu kontrol edin.');
            setEmailChangeStep(3); // Link gönderildi durumuna geç

        } catch (error) {
            setMessage(error.response?.data?.message || 'Onay linki gönderilirken bir hata oluştu.');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Şifre değiştirme alanları açıksa, kontrolleri yap
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
            if (formData.newPassword.length < 6) { // Minimum şifre uzunluğu kontrolü
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
                // Şifre değiştirme alanlarını sadece isPasswordChange aktifse ve değerleri varsa ekle
                ...(isPasswordChange && {
                    currentPassword: formData.currentPassword,
                    password: formData.newPassword // Backend 'password' olarak bekliyor
                })
            };

            const res = await axios.put('http://localhost:3000/api/users/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Başarılı olursa form verilerini temizle ve kullanıcıyı güncelle
            // E-posta değişimi ayrı bir akış olduğu için sadece temel bilgileri ve şifreyi güncelle
            setUser(res.data);
            setFormData(prev => ({
                ...prev,
                username: res.data.username,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                phoneNumber: res.data.phoneNumber,
                // Şifre alanlarını temizle
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

                {/* TEMEL BİLGİLER */}
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

                {/* E-POSTA DEĞİŞTİRME AKIŞI */}
                <div className="form-section email-change-section">
                    <h3 className="section-title">E-posta Adresi</h3>
                    <p className="current-email">Mevcut E-posta: <strong>{user.email || 'Yükleniyor...'}</strong></p>

                    {/* Durum 0: Değiştir Butonu */}
                    {emailChangeStep === 0 && (
                        <button type="button" className="btn-secondary" onClick={() => setEmailChangeStep(1)}>
                            E-posta Değiştir
                        </button>
                    )}

                    {/* Durum 1: Yeni E-posta Girişi */}
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

                    {/* Durum 3: Link Gönderildi Mesajı */}
                    {emailChangeStep === 3 && (
                         <div className="email-sent-message">
                            <p className="success-message">Onay linki **{newEmail}** adresine gönderildi. Lütfen gelen kutunuzu kontrol edin ve linke tıklayarak e-posta adresinizi doğrulayın.</p>
                            <button type="button" className="btn-secondary btn-small" onClick={() => setEmailChangeStep(0)}>
                                Bitir
                            </button>
                        </div>
                    )}
                </div>

                {/* ŞİFRE DEĞİŞTİRME ALANLARI */}
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

                {/* GÜNCELLE BUTONU VE MESAJLAR */}
                {message && <p className={`message ${message.includes('başarılı') || message.includes('gönderildi') ? 'success' : 'error'}`}>{message}</p>}

                <button type="submit" className="btn-primary submit-button">
                    Temel Bilgileri Güncelle
                </button>
            </form>
        </div>
    );
}

export default Profile;