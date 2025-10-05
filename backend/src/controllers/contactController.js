// backend/src/controllers/contactController.js

import nodemailer from 'nodemailer';

// Ortam değişkenlerini doğrudan kullanıyoruz
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // Gmail için SSL/TLS (587 portunda STARTTLS kullandığımız için false)
    auth: {
        user: process.env.EMAIL_USER, // ikonbirkur@gmail.com
        pass: process.env.EMAIL_PASS  // Uygulama Şifresi
    },
    // STARTTLS'yi etkinleştirin (587 portu için kritik)
    tls: {
        rejectUnauthorized: false 
    }
});

export const sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Mail içeriği
    const mailOptions = {
        // Gönderen Adres: Kullanıcıdan gelen maili reply-to olarak kullanmak daha güvenli.
        from: `"${name}" <${process.env.EMAIL_USER}>`, 
        to: process.env.EMAIL_USER, // Alıcı: ikonbirkur@gmail.com
        replyTo: email, // Bu sayede yanıtladığınızda doğrudan kullanıcıya gider

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
        // Hatanın detayını frontend'e göndermeyin, sadece genel bir hata mesajı verin
        res.status(500).json({ message: 'E-posta gönderilirken sunucu hatası oluştu. Lütfen konsolu kontrol edin.' });
    }
};

// Bu kontrolcüyü kullanmak için, ilgili Express rotasını tanımladığınızdan emin olun:
// app.post('/api/contact', sendContactEmail);