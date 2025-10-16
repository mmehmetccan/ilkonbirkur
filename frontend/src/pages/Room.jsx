// frontend/src/pages/Room.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL);
import '../styles/Room.css';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem("user"));

   const redirectBasedOnStatus = (currentRoom) => {
        if (!currentRoom || !userInfo) return;
        const playerInRoom = currentRoom.players.some(p => p.user._id.toString() === userInfo._id.toString());
           if (!playerInRoom) {
               navigate("/rooms");
               return;
           }
       switch (currentRoom.status) {
         case "drafting":
           navigate(`/room/${currentRoom._id}/squad-selection`);
           break;
         case "draft_finished":
           navigate(`/room/${currentRoom._id}/squad-selection`);
           break;
         case "in_progress":
           navigate(`/match/${currentRoom._id}`);
           break;

       }
     };


useEffect(() => {
    if (!roomId) return;

    socket.emit("joinRoom", roomId);

    socket.off("updateRoom");

    socket.on("updateRoom", (updatedRoom) => {
        setRoom(updatedRoom);
        redirectBasedOnStatus(updatedRoom);
    });

    return () => {
        socket.off("updateRoom");
    };

}, [roomId]);



useEffect(() => {
    const fetchRoom = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setRoom(data);
                redirectBasedOnStatus(data);
            }
        } catch (err) {
            console.error("Oda bilgisi alınırken hata:", err);
        }
    };

    socket.off("updateRoom");

    socket.on("updateRoom", (updatedRoom) => {
        setRoom(updatedRoom);
        redirectBasedOnStatus(updatedRoom);
    });

    socket.emit("joinRoom", roomId);
    fetchRoom();

    return () => {
        socket.off("updateRoom");
    };

}, [roomId, navigate]);





    const checkAndNavigate = (currentRoom) => {
        const allPlayersReady = currentRoom.players.every(p => p.isReady);
        const roomIsFull = currentRoom.players.length === currentRoom.maxPlayers;

        if (roomIsFull && allPlayersReady) {
            navigate(`/room/${currentRoom._id}/squad-selection`);
        }
    };
    const handleKickPlayer = async (playerId) => {


    try {
        const token = localStorage.getItem("token");
        await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/kick-player`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ roomId: room._id, playerId })
        });
    } catch (err) {
        console.error("Oyuncu çıkarma hatası:", err.message);
    }
};

    const handleReady = async () => {
        if (!room?._id) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/ready`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ roomId: room._id })
            });
            if (!res.ok) throw new Error("Hazır durumu güncellenirken hata oluştu.");

        } catch (err) {
            console.error("Hazır olma hatası:", err.message);
        }
    };

    const handleLeaveRoom = async () => {

        if (!room?._id) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/leave`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ roomId: room._id })
        });

        if (!res.ok) throw new Error("Odadan ayrılırken hata oluştu.");

        navigate("/rooms");

    } catch (err) {
        console.error(err.message);
        alert(err.message);
    }
};
    if (!room) {
        return <div className="loading">Oda Yükleniyor...</div>;
    }

    const allPlayersReady = room && room.players.length > 0 && room.players.every(p => p.isReady) && room.players.length === room.maxPlayers;
    const isCreator = userInfo._id === room.creator;
    const myPlayer = room.players.find(p => p.user._id.toString() === userInfo._id);

    return (
        <div className="room-container">
            <h2 className="room-title">🏟️ {room.roomName}</h2>

            <div className="room-details">
                <h3>Oyuncular</h3>
                <ul className="player-list">
                    {room.players.map(p => (
                        <li key={p.user._id} className={`player-item ${p.isReady ? "ready" : "waiting"}`}>
                            {p.name} {p.isReady ? "✅" : "⏳"}
                            {userInfo._id === room.creator && p.user._id !== room.creator && (
                                <button className="kick-btn" onClick={() => handleKickPlayer(p.user._id)}>
                                    ❌ Kick
                                </button>
                            )}
                        </li>
                    ))}
                </ul>

                {isCreator && allPlayersReady && (
                    <button className="start-btn" onClick={() => navigate(`/room/${roomId}/squad-selection`)}>
                        🚀 Oyuncu Seçimini Başlat!
                    </button>
                )}

                <div className="actions">
                    <button className="ready-btn" onClick={handleReady}>
                        {myPlayer?.isReady ? 'Hazırlığı İptal Et' : 'Hazırım ✅'}
                    </button>
                    <button className="leave-btn" onClick={handleLeaveRoom}>
                        Odadan Ayrıl ❌
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Room;
