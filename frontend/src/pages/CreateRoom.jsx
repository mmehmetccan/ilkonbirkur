// frontend/src/pages/CreateRoom.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../styles/CreateRoom.css';

function CreateRoom() {
    const [roomName, setRoomName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(2);
    const [password, setPassword] = useState('');
    const [leagues, setLeagues] = useState(['Premier League']);
    const navigate = useNavigate();

    const handleCreateRoom = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
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
            const response = await axios.post('http://localhost:3000/api/rooms/create', body, config);

            alert(response.data.message);
            // Başarılı olursa kullanıcıyı yeni oluşturulan odaya yönlendir
            navigate(`/room/${response.data.room._id}`);

        } catch (error) {
            console.error('Oda oluşturma hatası:', error.response?.data?.message || error.message);
            alert('Oda oluşturulurken bir hata oluştu: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="create-room-container"> {/* Class eklendi */}
            <h1>Yeni Oda Oluştur</h1>
            <form onSubmit={handleCreateRoom} className="create-room-form"> {/* Class eklendi */}

                <div className="form-group"> {/* Class eklendi */}
                    <label htmlFor="roomName">Oda Adı:</label>
                    <input
                        type="text"
                        id="roomName"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group"> {/* Class eklendi */}
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

                <div className="form-group"> {/* Class eklendi */}
                    <label htmlFor="password">Oda Şifresi (İsteğe Bağlı):</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="form-group"> {/* Class eklendi */}
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