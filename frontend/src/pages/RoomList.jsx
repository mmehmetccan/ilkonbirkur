// frontend/src/pages/RoomList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Home, Users, Lock, PlusCircle, Search, LogIn, KeyRound } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import '../styles/RoomList.css';

function RoomList() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joiningRoomId, setJoiningRoomId] = useState(null);
    const [password, setPassword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    let loggedInUserId = null;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            loggedInUserId = decoded.id || decoded._id;
        } catch (e) {
            console.error("Geçersiz token:", e);
        }
    }
    const userInfo = JSON.parse(localStorage.getItem("user"));
    const currentUserId = userInfo?._id;

    const fetchRooms = async () => {
        try {
            if (!token) {
            setError("Bu içeriği görmek için lütfen giriş yapın.");
                setLoading(false);
                return;
            }
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rooms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setRooms(response.data);
        } catch (err) {
            console.error("Oda listesi alınamadı:", err);
            setError('Oda listesi alınırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRooms(); }, []);

    const handleJoinRoom = async (roomId, passwordInput) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return alert("Lütfen önce giriş yapın.");

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            };

            const body = { roomId, password: passwordInput };

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/rooms/join`,
                body,
                config
            );

            alert(response.data.message);
            navigate(`/room/${response.data.room._id}`);
        } catch (error) {
            console.error("Odaya katılma hatası:", error.response?.data?.message || error.message);
            alert(error.response?.data?.message || "Odaya katılırken bir hata oluştu.");
        }
    };

    const renderPasswordInput = (roomId) => (
    <div>
        <input
            key={roomId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
      placeholder="Şifre"
      autoComplete="new-password"
      style={{ marginRight: '5px' }}
    />
        <button onClick={() => handleJoinRoom(roomId, password)}>Giriş Yap</button>
    </div>
);



    if (loading) return <div>Odalar yükleniyor...</div>;

    if (error) return <div className="error">{error}</div>;

    const filteredRooms = rooms
        .slice()
        .reverse()
        .filter(room => room.roomName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (

        <div className="room-list-container">
            <h1>Arkadaşlarınla Kendi İlk 11'ini Oluştur ve Bunu Turnuvaya Çevir</h1>

            <Helmet>
                <title>Aktif Oyun Odaları - ilkonbirkur.com</title>
                <meta
                    name="description"
                    content="Arkadaşlarınızla veya diğer oyuncularla buluşun. ilkonbirkur.com'daki aktif futbol menajerlik odalarını listeleyin, şifreli odalara katılın veya kendi odanızı oluşturun."
                />
            </Helmet>
            <h1 className="main-title">Oda Listesi</h1>

            <div className="room-controls">
                <div className="search-input-group">
                    <Search size={20} className="search-icon"/>
                    <input
                        type="text"
                        placeholder="Oda Adı Ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Link to="/create-room" className="create-room-button">
                    <PlusCircle size={20}/> Yeni Oda Oluştur
                </Link>
            </div>

            {filteredRooms.length === 0 ? (
                <div className="empty-state">
                    <Home size={40}/>
                    <p>Aktif oda bulunamadı. Hemen bir tane oluşturun!</p>
                </div>
            ) : (
                <ul className="room-list">
                    {filteredRooms.map((room) => {
                        const isInRoom = room.players.some(p => p.user?._id?.toString() === currentUserId?.toString());
                        const isFull = !isInRoom && room.players.length >= room.maxPlayers;
                        const isLocked = room.password;

                        return (
                            <li key={room._id} className={`room-item ${isFull ? 'room-full' : ''} ${isLocked ? 'room-locked' : ''}`}>
                                {/* İstenen renkli üst bandı buraya ekledik */}
                                <div className="room-header-band"></div>

                                <div className="room-details-left">
                                    <h3 className="room-name">
                                        {isLocked && <Lock size={18} className="lock-icon" />}
                                        {room.roomName}
                                    </h3>
                                    <p className="room-info">
                                        <Users size={16} className="icon"/> Oyuncular: <span className={`player-count ${isFull ? 'full' : ''}`}>{room.players.length}/{room.maxPlayers}</span>
                                    </p>
                                    {room.leagues && room.leagues.length > 0 && (
                                        <p className="room-info">Lig: {room.leagues.join(', ')}</p>
                                    )}
                                </div>

                                <div className="room-actions">
                                    {isInRoom ? (
                                        <button className="btn-join active" onClick={() => navigate(`/room/${room._id}`)}>
                                            <Home size={18}/> Odaya Geri Dön
                                        </button>
                                    ) : isFull ? (
                                        <button className="btn-join full" disabled>Oda Dolu</button>
                                    ) : isLocked ? (
                                        joiningRoomId === room._id ? renderPasswordInput(room._id) :
                                        <button className="btn-join password" onClick={() => { setJoiningRoomId(room._id); setPassword(''); }}>
                                            <KeyRound size={18}/> Şifreli Katıl
                                        </button>
                                    ) : (
                                        <button className="btn-join primary" onClick={() => handleJoinRoom(room._id, '')}>
                                            <LogIn size={18}/> Odaya Katıl
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
export default RoomList;
