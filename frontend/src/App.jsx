import React, { useState } from "react";
import {  Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import RoomList from './pages/RoomList';
import Room from './pages/Room';
import MatchResult from './pages/MatchResult';
import SquadSelection from './pages/SquadSelection';
import Profile from './pages/Profile.jsx';
import CustomSquad from './pages/CustomSquad.jsx';
import ConfirmEmail from './pages/ConfirmEmail';
import Contact from './pages/Contact.jsx';
import TermsOfService  from './pages/TermsOfService.jsx';
import SharedSquadsFeed from './pages/SharedSquadsFeed';
import SharedSquadDetail from './pages/SharedSquadDetail';
import SinglePlayerMatch from './pages/SinglePlayerMatch';

import logo from '../public/favicon-96x96.png';

import Footer from './pages/Footer';

import './App.css';

function App() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!user;
  const username = isLoggedIn ? user.username || user.name || "Kullanıcı" : "";

  const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
      if (dropdownOpen) setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleLogoutAndClose = () => {
    handleLogout();
    toggleMenu();
  }

  const handleNavigate = (path) => {
    navigate(path);
    toggleMenu();
  }

  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <div className="nav-logo">
          <Link to="/">
                <img src={logo} alt="ilkonbirkur.com Logo" className="navbar-logo-img" />
            </Link></div>

        <ul className="nav-links">
          <li><Link to="/">Taktik Kurucu</Link></li>
          <li><Link to="/ilk11kur">İlk 11 Oluşturucu</Link></li>
          <li><Link to="/squads">Paylaşılan Kadrolar</Link></li>
          <li><Link to="/hizli-mac">Hazır Takımlara Karşı Simülasyon</Link></li>
          <li><Link to="/rooms">Online Draft Odaları</Link></li>
          <li><Link to="/dashboard">Son Maçlar</Link></li>

        </ul>

        <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
        </button>

        <div className="profile-section desktop-profile-auth">
          {isLoggedIn ? (
            <div className="profile-dropdown">
              <button
                className="profile-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                Profil
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <p><strong>Kullanıcı Adı : {username}</strong></p>
                  <button
                    className="dropdown-link"
                    onClick={() => { navigate("/Profile"); setDropdownOpen(false); }}
                  >
                    Profil Bilgileri
                  </button>
                  <button
                    className="dropdown-logout"
                    onClick={handleLogout}
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="login-btn" onClick={() => navigate("/login")}>Giriş Yap</button>
              <button className="register-btn" onClick={() => navigate("/register")}>Kayıt Ol</button>
            </div>
          )}
        </div>


        <ul className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          {/* 1. Navigasyon Linkleri */}
          <li><Link to="/" onClick={toggleMenu}>taktik-kurucu</Link></li>
          <li><Link to="/ilk11kur" onClick={toggleMenu}>İlk 11 Oluşturucu</Link></li>
          <li><Link to="/hizli-mac"onClick={toggleMenu}>Hazır Takımlara Karşı Simülasyon</Link></li>
          <li><Link to="/rooms" onClick={toggleMenu}>Online Draft Odaları</Link></li>
          <li><Link to="/dashboard" onClick={toggleMenu}>Son Maçlar</Link></li>
          <li><Link to="/squads" onClick={toggleMenu}>Paylaşılan Kadrolar</Link></li>

          <div className="mobile-auth-buttons">
            {isLoggedIn ? (
                <>
                  <p>
                    Kullanıcı Adı : {username}
                  </p>
                  <button
                      className="dropdown-link"
                      onClick={() => handleNavigate("/Profile")}
                  >
                    Profil Bilgileri
                  </button>
                  <button
                      className="dropdown-logout"
                      onClick={handleLogoutAndClose}
                  >
                    Çıkış Yap
                  </button>
                </>
            ) : (
                <>
                  <button className="login-btn" onClick={() => handleNavigate("/login")}>Giriş Yap</button>
                  <button className="register-btn" onClick={() => handleNavigate("/register")}>Kayıt Ol</button>
                </>
            )}
          </div>
        </ul>

      </nav>

      <div className="container main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ilk11kur" element={<CustomSquad />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/match/:roomId" element={<MatchResult />} />
          <Route path="/room/:roomId/squad-selection" element={<SquadSelection />} />
          <Route path="/confirm-email/:token" element={<ConfirmEmail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/squads" element={<SharedSquadsFeed />} />
                <Route path="/squads/:id" element={<SharedSquadDetail />} />
                              <Route path="/hizli-mac" element={<SinglePlayerMatch />} /> {/* Bu satırı ekleyin */}

        </Routes>
      </div>

      <Footer />

    </div>
  );
}

export default App;