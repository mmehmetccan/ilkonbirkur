// frontend/src/pages/Contact.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Mail, MapPin, Phone } from 'lucide-react';
import '../styles/Contact.css'
const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [isSent, setIsSent] = useState(false);
    const [isError, setIsError] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSent(false);
    setIsError(false);

    try {

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/contact`, formData);

        console.log("Sunucudan gelen yanıt:", response.data.message);

        setIsSent(true);

        setFormData({ name: '', email: '', subject: '', message: '' });

    } catch (error) {
        console.error("Mesaj gönderme hatası:", error);

        setIsError(true);

    }

    setTimeout(() => {
        setIsSent(false);
        setIsError(false);
    }, 5000);
};

    return (
        <div className="page-content contact-page">
            <h1>İletişim</h1>
            <p className="page-subtitle">Sorularınız, geri bildirimleriniz veya destek talepleriniz için bize yazmaktan çekinmeyin.
Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>

            <div className="contact-grid">

                <div className="contact-form-container">
                    <h2>Send a Direct Message</h2>
                    {isSent ? (
                        <div className="success-message">
                            Your message has been successfully sent! Thank you.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="contact-form">
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="subject"
                                placeholder="Subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                            <textarea
                                name="message"
                                placeholder="Your Message..."
                                value={formData.message}
                                onChange={handleChange}
                                rows="5"
                                required
                            ></textarea>
                            <button type="submit" className="btn-submit">
                                Mail Gönder
                            </button>
                        </form>
                    )}
                </div>

                <div className="contact-info-block">
                    <h2>Our Contact Details</h2>
                    <div className="info-item">
                        <Mail size={24} className="info-icon" />
                        <div>
                            <strong>Email</strong>
                            <p>ilkonbirkur@gmail.com</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <MapPin size={24} className="info-icon" />
                        <div>
                            <strong>Address</strong>
                            <p>Istanbul, Turkey</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;