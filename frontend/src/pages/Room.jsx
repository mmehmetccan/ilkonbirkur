// frontend/src/pages/Room.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io({
        
    // Varsayılan olarak WebSocket kullanmayı dener (HTTP yerine)
    transports: ['websocket', 'polling']
});
import '../styles/Room.css';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem("user")); // localStorage'da "user" olarak tutulduğu için bu şekilde düzeltildi

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
    // Room.jsx içinde, eski iki useEffect bloğunun yerine bu tek bloğu kullanın


// Room.jsx'te, birinci useEffect
useEffect(() => {
    if (!roomId) return;
    
    // Yalnızca dinlemeyi ve odaya katılmayı yönet
    socket.emit("joinRoom", roomId);

    // KRİTİK: Önceki dinleyiciyi temizle
    socket.off("updateRoom"); 
    
    socket.on("updateRoom", (updatedRoom) => {
        // Event geldiğinde state'i güncelle (Bu anlık yenilemeyi sağlayacak)
        setRoom(updatedRoom);
        redirectBasedOnStatus(updatedRoom);
    });

    // Component ayrıldığında temizle
    return () => {
        socket.off("updateRoom");
        // İsteğe bağlı: socket.emit("leaveRoom", roomId);
    };

    // Bu blok sadece roomId ve socket objesi değiştiğinde çalışmalı
}, [roomId]);



// Room.jsx'te, ikinci useEffect
// Room.jsx içinde, mevcut iki useEffect bloğunun yerine bu tek bloğu kullanın
useEffect(() => {
    // 1. Oda verisini çeken API fonksiyonu
    const fetchRoom = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            // Önemli: Dinamik URL kullanılıyor.
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Not: setRoom(data); satırının altında 'data' objesini kullanmalısınız.
                setRoom(data);
                redirectBasedOnStatus(data); 
            }
        } catch (err) {
            console.error("Oda bilgisi alınırken hata:", err);
        }
    };
    
    // 2. Socket.IO Dinleme Bloğu (KRİTİK)
    // Önceki dinleyiciyi temizle: Bu, anlık güncelleme sorununu çözen ana faktördür.
    socket.off("updateRoom"); 
    
    // Dinleyiciyi yeniden kaydet
    socket.on("updateRoom", (updatedRoom) => {
        setRoom(updatedRoom);
        redirectBasedOnStatus(updatedRoom);
    });
    
    // 3. Odaya katılma sinyalini gönder ve veriyi çek
    socket.emit("joinRoom", roomId);
    fetchRoom();

    // 4. Component Ayrıldığında Dinleyiciyi Kaldır
    return () => {
        socket.off("updateRoom");
        // İsteğe bağlı: socket.emit("leaveRoom", roomId);
    };
    
// Bağımlılık dizisi sadece roomId değiştiğinde çalışmalıdır.
}, [roomId, navigate]); 

// NOT: İkinci (sadece room'u dinleyen) useEffect'i sildiğinizden emin olun.




    // ✅ Yeni eklenen fonksiyon: Yönlendirme koşullarını denetler
    const checkAndNavigate = (currentRoom) => {
        // Oda dolduysa VE tüm oyuncular hazırsa 'drafting' moduna geçiş yap
        const allPlayersReady = currentRoom.players.every(p => p.isReady);
        const roomIsFull = currentRoom.players.length === currentRoom.maxPlayers;

        if (roomIsFull && allPlayersReady) {
            // Eğer odanın durumu henüz 'drafting' değilse, backend'e sinyal gönder
            // Ancak, bu işlemi backend tarafında yapmak daha doğru olur.
            // Sadece yönlendirmeyi burada yapıyoruz.
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
        // Socket.IO ile güncelleme zaten yapılacak
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

        // Başarılıysa kullanıcıyı ana sayfaya veya oda listesine yönlendir
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
