import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css'
function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* 1. HERO SECTION (KAHRAMAN BÖLÜMÜ) */}
      <section className="hero-section">

        {/* Görsel Alanı (CSS ile arka plan resmi eklenecek) */}
        <div className="hero-image-placeholder"></div>

        <div className="hero-content">
          <h1>Hayalindeki 11'i Kur, Sahaya Çık!</h1>
          <h2>Futbol Menajerlik Deneyimini Canlı Odalarda Yaşa.</h2>

          <div className="cta-group">
            <button
              className="cta-button primary-cta"
              onClick={() => navigate('/ilk11kur')} // Kadro kurma sayfasına yönlendir
            >
              Hemen Kadro Kur
            </button>

            {/* YENİ CTA: ODALAR KISMI (Turnuva Odaları) */}
            <button
              className="cta-button tertiary-cta"
              onClick={() => navigate('/rooms')} // Oda Listesi sayfasına yönlendir
            >
              🏆 Arkadaşlarınla Turnuva Yap
            </button>

            <button
              className="cta-button secondary-cta"
              onClick={() => navigate('/register')} // Kayıt sayfasına yönlendir
            >
              Ücretsiz Kayıt Ol
            </button>
          </div>
        </div>
      </section>

      {/* 2. ÖZELLİKLER BÖLÜMÜ */}
      <section className="features-section">
        <h3>Neden Bizi Seçmelisin?</h3>
        <div className="features-grid">

          <div className="feature-card">
            <h4>⚽ Taktiksel Derinlik</h4>
            <p>Sınırsız oyuncu ve diziliş seçeneği ile en karmaşık taktikleri bile kolayca hazırla.</p>
          </div>

          <div className="feature-card">
            <h4>🏆 Canlı Oda Deneyimi</h4>
            <p>Arkadaşlarınla özel odalar oluştur, kurduğun kadrolarla maç yap ve sonuçları takip et.</p>
          </div>

          <div className="feature-card">
            <h4>💡 Hızlı ve Modern Arayüz</h4>
            <p>Sürükle bırak özelliği sayesinde kadronu saniyeler içinde kur ve tasarladığın kadroyu paylaş.</p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;