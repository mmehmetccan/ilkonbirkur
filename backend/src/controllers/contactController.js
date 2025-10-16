// backend/src/controllers/contactController.js

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false 
    }
});

export const sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: email,

        subject: `[İletişim Formu] ${subject}`,
        html: `
            <h3>Yeni İletişim Formu Mesajı</h3>
            <p><strong>Gönderen Adı:</strong> ${name}</p>
            <p><strong>Gönderen E-postası:</strong> ${email}</p>
            <p><strong>Konu:</strong> ${subject}</p>
            <hr/>
            <p><strong>Mesaj:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Mesaj başarıyla gönderildi!' });
    } catch (error) {
        console.error('E-posta Gönderme Hatası:', error);
        res.status(500).json({ message: 'E-posta gönderilirken sunucu hatası oluştu. Lütfen konsolu kontrol edin.' });
    }
};

