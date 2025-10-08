// frontend/src/pages/CreateRoom.jsx

import React, { useState, useEffect } from 'react'; // useEffect import edildi
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../styles/CreateRoom.css';

const BASE_API_URL = import.meta.env.VITE_API_URL;

function CreateRoom() {
    const [roomName, setRoomName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(2);
    const [password, setPassword] = useState('');
    const [leagues, setLeagues] = useState(['Premier League']);

    // YENİ EKLENEN STATE: Hata veya bilgi mesajlarını tutmak için
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // YENİ EKLENEN KISIM: Sayfa yüklendiğinde giriş kontrolü yapar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Yönlendirme yapmak yerine hata state'ini günceller
            setError("Oda oluşturmak için lütfen giriş yapın.");
        }
    }, []); // Boş dependency array sayesinde sadece sayfa ilk yüklendiğinde çalışır

    const handleCreateRoom = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            // Bu kontrol yedek olarak kalabilir, güvenlik sağlar.
            alert('Lütfen önce giriş yapın.');
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            const body = { roomName, maxPlayers, leagues, password: password || undefined };
            const response = await axios.post(`${BASE_API_URL}/api/rooms/create`, body, config);

            alert(response.data.message);
            navigate(`/room/${response.data.room._id}`);

        } catch (error) {
            console.error('Oda oluşturma hatası:', error.response?.data?.message || error.message);
            alert('Oda oluşturulurken bir hata oluştu: ' + (error.response?.data?.message || error.message));
        }
    };

    // --- YENİ EKLENEN KISIM: Koşullu Görüntüleme (Conditional Rendering) ---
    // Eğer bir hata mesajı varsa (giriş yapılmamışsa), formu gösterme, mesajı göster.
        if (error) return <div className="error">{error}</div>;


    // Hata yoksa, normal formu göster.
    return (
        <div className="create-room-container">
            <h1>Yeni Oda Oluştur</h1>
            <form onSubmit={handleCreateRoom} className="create-room-form">

                <div className="form-group">
                    <label htmlFor="roomName">Oda Adı:</label>
                    <input
                        type="text"
                        id="roomName"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="maxPlayers">Maksimum Oyuncu Sayısı:</label>
                    <input
                        type="number"
                        id="maxPlayers"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                        min="2"
                        max="8"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Oda Şifresi (İsteğe Bağlı):</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Ligler:</label>
                    <select multiple value={leagues}
                            onChange={(e) => setLeagues(Array.from(e.target.selectedOptions, option => option.value))}>
                        <option value="all">Tüm Ligler</option>
                        <option value="Premier League">Premier League</option>
                        <option value="La Liga">La Liga</option>
                        <option value="Serie A">Serie A</option>
                        <option value="Bundesliga">Bundesliga</option>
                        <option value="Ligue 1">Ligue 1</option>
                        <option value="Süper Lig">Süper Lig</option>
                        <option value="Eredivisie">Eredivisie</option>
                        <option value="1A Pro League">Belçika Pro Lig</option>
                    </select>
                </div>
                <button type="submit">
                    Oda Oluştur
                </button>
            </form>
        </div>
    );
}

export default CreateRoom;