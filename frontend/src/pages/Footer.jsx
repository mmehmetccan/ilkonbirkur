// frontend/src/components/Footer.jsx

import React from 'react';
import { Facebook, Twitter, Instagram, Mail, MapPin } from 'lucide-react';
import '../styles/Footer.css'
const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="footer-content">

                <div className="footer-section about">
                    <h2 className="footer-logo">ilkonbirkur.com</h2>
                    <p>
                        Stratejinin ve tutkunun buluştuğu yer. Hayalindeki takımı kur, turnuvaya katıl ve zafere ulaş!
                    </p>
                    <div className="contact-info">
                        <span><MapPin size={16} /> İstanbul, Türkiye</span>
                        <span><Mail size={16} /> ilkonbirkur@gmail.com</span>
                    </div>
                </div>

                <div className="footer-section links">
                    <h3>Hızlı Bağlantılar</h3>
                    <ul>
                        <li><a href="/">Anasayfa</a></li>
                        <li><a href="/dashboard">Turnuva Geçmişi</a></li>
                        <li><a href="/hakkimizda">Hakkımızda</a></li>
                        <li><a href="/Contact">İletişim</a></li>
                        <li><a href="/terms-of-service">Kullanım Şartları</a></li>
                    </ul>
                </div>

                <div className="footer-section social">
                    <h3>Bizi Takip Edin</h3>
                    <div className="social-links">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <Facebook size={24} />
                        </a>
                        <a href="https://x.com/ilkonbirkur" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                            <Twitter size={24} />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <Instagram size={24} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                &copy; {currentYear} ilkonbirkur.com. Tüm hakları saklıdır.
            </div>
        </footer>
    );
};

export default Footer;