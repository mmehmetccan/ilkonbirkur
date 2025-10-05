// backend/src/controllers/userController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Token oluşturma
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Kayıt
const registerUser = async (req, res) => {
    const { username, firstName, lastName, email, password, phoneNumber } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'Bu email zaten kullanılıyor.' });
    }

    // Kullanıcı adı benzersizlik kontrolü (Eğer şemada zorunlu ve benzersiz ise)
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
        return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }

    const user = await User.create({
        username,
        firstName,
        lastName,
        email,
        password,
        phoneNumber
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Kullanıcı oluşturulamadı.' });
    }
};

// Login
const authUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Geçersiz email veya şifre.' });
    }
};

// Hesap bilgileri (sadece giriş yapan görebilir)
const getMyAccount = async (req, res) => {
    // req.user, authMiddleware tarafından eklenir
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json(user);
};


const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 saat
        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
        const message = `Şifreyi sıfırlamak için link: ${resetUrl}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Şifre Sıfırlama',
            text: message,
        });

        res.status(200).json({ message: 'E-posta gönderildi.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};


// Şifre sıfırlama (linkten)
const resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token, // düz token
            resetPasswordExpire: { $gt: Date.now() } // süresi geçmemiş
        });

        if (!user) return res.status(400).json({ message: 'Token geçersiz veya süresi dolmuş.' });

        if (req.body.password.length < 6) {
             return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
        }

        // Yeni şifreyi kaydet
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Şifreniz başarıyla güncellendi.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};


// E-posta değiştirme isteği (mail doğrulamalı)
const requestEmailChange = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const { newEmail } = req.body;

    // ❗ İYİLEŞTİRME: Yeni e-posta adresinin başkası tarafından kullanılıp kullanılmadığını kontrol et
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor." });
    }

    const token = jwt.sign({ id: user._id, newEmail }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const confirmUrl = `${process.env.CLIENT_URL}/confirm-email/${token}`;

    const message = `Yeni email adresinizi onaylamak için linke tıklayın: ${confirmUrl}`;

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Destek" <${process.env.EMAIL_USER}>`,
            to: newEmail,
            subject: "Email Değiştirme Onayı",
            text: message,
        });

        res.json({ message: "Onay linki yeni email adresinize gönderildi." });
    } catch (error) {
        console.error('Email change request error:', error);
        res.status(500).json({ message: 'E-posta gönderimi başarısız oldu. Lütfen sunucu loglarını kontrol edin.' });
    }
};

// E-posta güncelleme onayı
const confirmEmailChange = async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

        // E-posta zaten kullanılıyor mu kontrolü (Güvenlik katmanı)
        const emailExists = await User.findOne({ email: decoded.newEmail });
        if (emailExists && emailExists._id.toString() !== decoded.id) {
            return res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor." });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

        user.email = decoded.newEmail;
        await user.save();

        res.json({ message: "Email adresiniz başarıyla güncellendi." });
    } catch (error) {
        res.status(400).json({ message: "Token geçersiz veya süresi dolmuş." });
    }
};

// Hesabım - Kullanıcı bilgilerini getir
const getProfile = async (req, res) => {
    // req.user auth middleware'den gelir
    res.json({
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phoneNumber: req.user.phoneNumber,
    });
};

// Hesap bilgilerini güncelle (email, şifre vs.)
const updateProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    let successMessage = "Profil bilgileri başarıyla güncellendi.";
    let passwordChanged = false;

    if (user) {
        // --- ŞİFRE DEĞİŞTİRME KONTROLÜ (GÜVENLİK) ---
        // Yeni şifre frontend'den 'password' veya 'newPassword' olarak gelebilir.
        const newPasswordValue = req.body.password || req.body.newPassword;

        if (req.body.currentPassword || newPasswordValue) {

            // 1. Mevcut şifre zorunluluğu
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: "Şifre değiştirmek için mevcut şifrenizi girmelisiniz." });
            }

            // 2. Mevcut şifre doğruluğu kontrolü
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: "Mevcut şifreniz yanlış." });
            }

            // 3. Yeni şifre zorunluluğu
            if (!newPasswordValue) {
                 return res.status(400).json({ message: "Yeni şifrenizi girmelisiniz." });
            }

            // 4. Yeni şifre uzunluk kontrolü
            if (newPasswordValue.length < 6) {
                 return res.status(400).json({ message: "Yeni şifre en az 6 karakter olmalıdır." });
            }

            // Yeni şifreyi kaydet
            user.password = newPasswordValue;
            passwordChanged = true;
        }

        // --- DİĞER ALANLARIN GÜNCEL KONTROLÜ ---
        // E-posta alanı sadece requestEmailChange/confirmEmailChange ile güncellenmelidir.
        user.username = req.body.username || user.username;
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

        const updatedUser = await user.save();

        // Şifre değiştiyse özel mesajı ayarla
        if (passwordChanged) {
            successMessage = "Şifreniz başarıyla değiştirildi!"; // ✅ Özel mesaj
        }

        // --- CEVAP DÖNDÜRME ---
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phoneNumber: updatedUser.phoneNumber,
            token: generateToken(updatedUser._id),
            message: successMessage
        });
    } else {
        res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
};


module.exports = {
    registerUser,
    authUser,
    getMyAccount,
    forgotPassword,
    resetPassword,
    requestEmailChange,
    confirmEmailChange,
    updateProfile,
    getProfile
};