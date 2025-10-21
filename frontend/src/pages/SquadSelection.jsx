// frontend/src/pages/SquadSelection.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import '../styles/SquadSelection.css';

const socket = io(import.meta.env.VITE_API_URL);

const fieldPositions = {
  "4-3-3": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["CM", "CM", "CM"],
    FWD: ["RW", "ST", "LW"],
  },
  "3-5-2": {
    GK: ["GK"],
    DEF: ["CB", "CB", "CB"],
    MID: ["RM", "CM", "CAM", "CM", "LM"],
    FWD: ["ST", "ST"],
  },
  "4-4-2": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["RM", "CM", "CM", "LM"],
    FWD: ["ST", "ST"],
  },
  "4-2-3-1": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["CDM", "CDM"],
    AMF: ["RW", "CAM", "LW"],
    FWD: ["ST"],
  },
  "3-4-3": {
    GK: ["GK"],
    DEF: ["CB", "CB", "CB"],
    MID: ["RM", "CM", "CM", "LM"],
    FWD: ["RW", "ST", "LW"],
  },
  "5-3-2": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "CB", "LB"],
    MID: ["CM", "CM", "CAM"],
    FWD: ["ST", "ST"],
  },
  "4-1-4-1": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["CDM"],
    AMF: ["RM", "CM", "CM", "LM"],
    FWD: ["ST"],
  },
     "4-1-2-1-2": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["CDM", "CM", "CM", "CAM"],
    FWD: ["ST", "ST"],
  },

  "4-5-1": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["RM", "CM", "CDM", "CM", "LM"],
    FWD: ["ST"],
  },

  "4-3-1-2": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["CM", "CDM", "CM"],
    AMF: ["CAM"],
    FWD: ["ST", "ST"],
  },

  "4-2-2-2": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["CDM", "CDM"],
    AMF: ["CAM", "CAM"],
    FWD: ["ST", "ST"],
  },

  "4-3-2-1": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "LB"],
    MID: ["CDM", "CM", "CM"],
    AMF: ["CAM", "CAM"],
    FWD: ["ST"],
  },

  "5-4-1": {
    GK: ["GK"],
    DEF: ["RB", "CB", "CB", "CB", "LB"],
    MID: ["RM", "CM", "CM", "LM"],
    FWD: ["ST"],
  },
};

const getPlayerForSlot = (squad, generalPos, slotIndex) => {
  const slotKey = `${generalPos}-${slotIndex}`;
  return squad.find((p) => p.assignedPosition === slotKey) || null;
};

function SquadSelection() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [players,setPlayers] = useState([]);
    const [room,setRoom] = useState(null);
    const [searchTerm,setSearchTerm] = useState("");
    const [formation, setFormation] = useState(null);
    const [mySquad,setMySquad] = useState([]);
    const [selectedSlot,setSelectedSlot] = useState(null);
    const [visibleSquadId, setVisibleSquadId] = useState(null);
    const [visibleFormation, setVisibleFormation] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 20;

    const [showHostWaitModal, setShowHostWaitModal] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem("user"));
    const myUserId = userInfo._id;

    const allPlayersInRoom = room ? room.players.map(p => ({
        id: p.user._id.toString(),
        name: p.name,
        squad: p.team.squad,
        formation: room.formation ? room.formation[p.user._id.toString()] : null,
    })) : [];

    const isHost = room && room.players[0].user._id === myUserId;
    const currentPickerName = room ? room.players[room.draft.currentPick]?.name || 'Bekleniyor' : 'Bekleniyor';
    const isDraftFinished = room ? room.status==='draft_finished' : false;

    useEffect(() => {
        if (isDraftFinished && room) {
            setShowHostWaitModal(true);
        }
    }, [isDraftFinished, room]);

    const isMyTurn = useMemo(() => {
        if (!room || !room.players || room.draft.currentPick === undefined) return false;
        const currentPickUser = room.players[room.draft.currentPick].user;
        const currentPickUserId = currentPickUser._id ? currentPickUser._id.toString() : currentPickUser.toString();
        return myUserId === currentPickUserId;
    }, [room, myUserId]);

    useEffect(()=>{
        const fetchPlayers = async()=>{
    try{
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/players/all-players`);

        setPlayers(res.data || []);
    }
    catch (e) {
        console.error("Oyuncu listesi hatası:", e);
    }
};
        const fetchRoom = async()=>{
            const token = localStorage.getItem("token");
            if(!token) return;
            try{
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/${roomId}`, { headers:{ Authorization:`Bearer ${token}` } });
                const data = await res.json();
                if(res.ok){
                    setRoom(data);
                    const squad = data.players.find(p=>p.user._id.toString()===myUserId)?.team.squad || [];
                    setMySquad(squad);

                    if (data.formation && data.formation[myUserId]) {
                        setFormation(data.formation[myUserId]);
                    }
                }
            }catch(e){console.error("Oda hatası:",e);}
        };
        fetchPlayers();
        fetchRoom();
    }, [roomId, navigate, myUserId]);


    useEffect(() => {
        if (!roomId) return;
        socket.emit("joinRoom", roomId);

        socket.on("updateRoom", (updatedRoom) => {
            setRoom(updatedRoom);

            if (updatedRoom.status === 'in_progress') {
                navigate(`/match/${roomId}`);
            }

            const myInfo = JSON.parse(localStorage.getItem("user"));
            if (myInfo) {
                const squad = updatedRoom.players.find((p) => p.user._id.toString() === myInfo._id)?.team.squad || [];
                setMySquad(squad);

                if (updatedRoom.formation && updatedRoom.formation[myInfo._id]) {
                    setFormation(updatedRoom.formation[myInfo._id]);
                }
            }
        });

        socket.on("in_progress", (roomId) => {
            navigate(`/match/${roomId}`);
        });

        return () => {
            socket.off("updateRoom");
            socket.off("in_progress");
        };
    }, [roomId, navigate]);

    useEffect(() => {
        if (!room || !userInfo) return;

        if (!visibleSquadId) {
            setVisibleSquadId(myUserId);
        }

        const selectedPlayer = room.players.find(p => p.user._id.toString() === visibleSquadId);

        if (selectedPlayer) {
            const playerFormation = room.formation && room.formation[visibleSquadId];

            if (visibleSquadId === myUserId) {
                setVisibleFormation(formation || playerFormation || null);
            } else {
                setVisibleFormation(playerFormation || null);
            }
        } else {
            setVisibleFormation(null);
        }
    }, [room, userInfo, visibleSquadId, formation, myUserId]);

    const { currentSquad, currentFormationLayout } = useMemo(() => {
        if (!room || !visibleSquadId) return { currentSquad: [], currentFormationLayout: null };

        const playerInfo = room.players.find(p => p.user._id.toString() === visibleSquadId);
        const squad = playerInfo ? playerInfo.team.squad : [];

        const layout = visibleFormation ? fieldPositions[visibleFormation] : null;

        return { currentSquad: squad, currentFormationLayout: layout };
    }, [room, visibleSquadId, visibleFormation]);


    const handleStartTournament = async()=>{
        try{
            const token = localStorage.getItem("token");
            await fetch(`${import.meta.env.VITE_API_URL}/api/match/${room._id}/start-tournament`,{
                method:"POST",
                headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${token}` }
            });
        }catch(e){console.error("Turnuva başlatma hatası:",e);}
    };

    const handleCloseModal = () => {
        setSelectedSlot(null);
        setSearchTerm("");
        setCurrentPage(1);
    };

    const handlePickPlayer = async(playerName, assignedPosition = null)=>{
        try{
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/${room._id}/pick-player`,{
                method:"POST",
                headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
                body: JSON.stringify({playerName, assignedPosition})
            });
            if(!res.ok){ const data=await res.json(); throw new Error(data.message); }


        }catch(e){console.error("Oyuncu seçme hatası:",e);}
    };

    const handleSelectSlot = (generalPos, slotIndex) => {
    console.log("🔍 Slot tıklandı:", { generalPos, slotIndex });
    console.log("visibleSquadId:", visibleSquadId);
    console.log("myUserId:", myUserId);
    console.log("isMyTurn:", isMyTurn);
    console.log("mySquad.length:", mySquad.length);

    if (visibleSquadId === myUserId && mySquad.length < 11 && isMyTurn) {
        console.log("✅ Şartlar sağlandı, modal açılıyor...");
        setSelectedSlot({ generalPos, slotIndex });
        setCurrentPage(1);
    } else {
        console.warn("⚠️ Modal açılmadı. Neden:");
        if (visibleSquadId !== myUserId) console.warn("Farklı kadro açık!");
        if (mySquad.length >= 11) console.warn("Zaten 11 oyuncu var!");
        if (!isMyTurn) console.warn("Sıra sende değil!");
    }
};

    const handlePickAndAssign = (player) => {
        const assignedPositionKey = `${selectedSlot.generalPos}-${selectedSlot.slotIndex}`;
        handlePickPlayer(player.short_name, assignedPositionKey);
        handleCloseModal();
    };

    const handleSelectFormation = async (selected) => {
        setFormation(selected);
        setVisibleFormation(selected);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/${room._id}/set-formation`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ formation: selected }),
            });
            if (!res.ok) {
                console.error("Formasyon kaydetme API hatası:", await res.json());
            }
        } catch (e) {
            console.error("Formasyon kaydetme ağ hatası:", e);
        }
    };

    const handleTabClick = (playerId) => {
        setVisibleSquadId(playerId);
        setSelectedSlot(null);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);


    if (!room || players.length === 0) return <div>Yükleniyor...</div>;

    const pickedPlayerNames = new Set(room.players.flatMap(p=>p.team.squad.map(s=>s.short_name)));

    const baseFilteredPlayers = players.filter(p=>
        !pickedPlayerNames.has(p.short_name) &&
        (room.leagues.includes("all")||room.leagues.includes(p.league_name)) &&
        (p.short_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.long_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const playersForSlotPosition = baseFilteredPlayers
        .filter(p => {
            if (!selectedSlot || !fieldPositions[formation]) return true;
            const requiredPosition = fieldPositions[formation][selectedSlot.generalPos][selectedSlot.slotIndex];
            const playerPositions = p.player_positions.split(",").map(pos => pos.trim());
            return playerPositions.includes(requiredPosition);
        });

    const totalPlayersForSlot = playersForSlotPosition.length;
    const totalPages = Math.ceil(totalPlayersForSlot / playersPerPage);

    const indexOfLastPlayer = currentPage * playersPerPage;
    const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
    const currentPlayersForSlot = playersForSlotPosition.slice(indexOfFirstPlayer, indexOfLastPlayer);

    const visiblePages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }


    return (
        <div className="squad-selection-container">
            <h2 className="main-title">Takım Seçimi</h2>
            <p className="current-turn">
                Sıra:
                <span className={isMyTurn ? 'my-turn-name' : ''}> {currentPickerName}</span>
            </p>

            {isDraftFinished && isHost && (
                <div className="start-tournament-wrapper top-placement">
                    <button className="start-tournament-button" onClick={handleStartTournament}>
                        Turnuvayı Başlat
                    </button>
                </div>
            )}



            <div className="main-content-layout">

                <div className="field-column">
                    <div className="section-card formation-field-card">
                        <div className="formation-selection">
                            {visibleSquadId === myUserId ? (
                                !formation ? (
                                    <div>
                                        <h3 className="section-title">Dizilişini Seç</h3>
                                        <select className="select-formation" onChange={(e) => handleSelectFormation(e.target.value)} defaultValue="">
                                            <option value="" disabled>Seçiniz</option>
                                            {Object.keys(fieldPositions).map((f) => (<option key={f} value={f}>{f}</option>))}
                                        </select>
                                    </div>
                                ) : (
                                    <h3 className="section-title">Seçilen Diziliş: <span>{formation}</span></h3>
                                )
                            ) : (
                                <h3 className="section-title">Görüntülenen Diziliş: <span>{visibleFormation || 'Seçilmedi'}</span></h3>
                            )}
                        </div>

                        {currentFormationLayout ? (
                            <>
                                <h3 className="section-title">Saha Düzeni</h3>
                                <div className="field-area-wrapper">
                                    <div className="field-container">
                                        <div className="soccer-field">
                                            <div className="penalty-box top"></div>
                                            <div className="six-yard-box top"></div>
                                            <div className="penalty-box bottom"></div>
                                            <div className="six-yard-box bottom"></div>

                                            {Object.keys(currentFormationLayout).map((generalPos) => (
                                                <div className="row" key={generalPos}>
                                                    {currentFormationLayout[generalPos].map((specificPos, slotIndex) => {
                                                        const player = getPlayerForSlot(currentSquad, generalPos, slotIndex);
                                                        const slotKey = `${generalPos}-${slotIndex}`;
                                                        const isSelected = selectedSlot && selectedSlot.generalPos === generalPos && selectedSlot.slotIndex === slotIndex && visibleSquadId === myUserId;

                                                        return (
                                                            <div
                                                                key={slotKey}
                                                                className={`player-slot ${isSelected ? 'selected-slot-visual' : ''} ${visibleSquadId === myUserId && isMyTurn && !player ? 'my-turn-slot' : ''}`}
                                                                onClick={visibleSquadId === myUserId && !player ? () => handleSelectSlot(generalPos, slotIndex) : undefined}
                                                            >
                                                                {player ? (
                                                                    <div className="player-card">
                                                                        <img
                                                                            src={`https://images.weserv.nl/?url=${encodeURIComponent(player.player_face_url)}`}
                                                                            alt={player.short_name}
                                                                            onError={(e)=>{e.target.src='/default_player.png';}}
                                                                        />
                                                                        <div className="player-name-overlay">{player.short_name}</div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="empty-slot-text">{specificPos}</div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="section-card" style={{textAlign: 'center', padding: '20px'}}>
                                <p style={{fontSize: '1.1em', color: '#888'}}>Saha düzenini görmek için lütfen bir **diziliş seçiniz**.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="squad-column">
                    <div className="squad-tabs">
                        {allPlayersInRoom.map(p => (
                            <button
                                key={p.id}
                                className={`tab-button ${p.id === visibleSquadId ? 'active-tab' : ''}`}
                                onClick={() => handleTabClick(p.id)}
                            >
                                <span className="player-name-text">{p.name}</span>
                                <span className="squad-count"> ({p.squad.length}/11)</span>
                                {p.id === myUserId && <span className="sen-label">(SEN)</span>}
                            </button>
                        ))}
                    </div>

                    <div className="section-card my-squad-section squad-list-card">
                        <h3 className="section-title squad-list-title">
                            {visibleSquadId === myUserId ? 'Senin Kadron' : `${allPlayersInRoom.find(p => p.id === visibleSquadId)?.name}'in Kadrosu`}
                            <span> ({currentSquad.length}/11)</span>
                        </h3>
                        <ul className="squad-list">
                            {currentSquad.map((p, i) => (
                                <li key={i} className="squad-player-item">
                                    <img src={`https://images.weserv.nl/?url=${encodeURIComponent(p.player_face_url)}`}
                                         alt={p.short_name} className="squad-player-img"
                                         onError={(e)=>{e.target.src='/default_player.png';}}/>
                                    <div className="player-info">
                                        <span className="player-name-overlay">{p.short_name}</span>
                                        <span className="player-pos-detail">{p.assignedPosition || p.player_positions}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>


            {selectedSlot && (
                <div className="player-selection-modal is-open">
                    <div className="modal-content">
                        <button className="modal-close-button" onClick={handleCloseModal}>&times;</button>
                        <h3>{fieldPositions[formation][selectedSlot.generalPos][selectedSlot.slotIndex]} Pozisyonu İçin Oyuncu Seç</h3>

                        <input type="text" placeholder="Oyuncu ara..." value={searchTerm} onChange={handleSearchChange}/>

                        <ul className="modal-player-list">
                            {currentPlayersForSlot.length > 0 ? (
                                currentPlayersForSlot.map(p => (
                                    <li key={p.short_name} onClick={() => handlePickAndAssign(p)}>
                                        <img  src={`https://images.weserv.nl/?url=${encodeURIComponent(p.player_face_url)}`}
                                              alt={p.short_name}
                                              onError={(e)=>{e.target.src='/default_player.png';}}/>
                                        <span>{p.short_name} - {p.player_positions}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="no-players-found">Oyuncu bulunamadı veya bu sayfada uygun oyuncu yok.</li>
                            )}
                        </ul>

                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Önceki</button>
                                <div className="page-numbers">
                                    {visiblePages.map(number => (
                                        <button key={number} onClick={() => paginate(number)} className={currentPage === number ? 'active-page' : ''}>{number}</button>
                                    ))}
                                </div>
                                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Sonraki</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showHostWaitModal && (
                <div className="host-wait-modal-overlay">
                    <div className="host-wait-modal-content">
                        <h2>Draft Tamamlandı!</h2>
                        <p>Tüm kadrolar kuruldu. Turnuvanın başlaması için **oda sahibinin** onayı bekleniyor.</p>

                        {isHost ? (
                            <button className="start-tournament-button" onClick={handleStartTournament}>Turnuvayı Başlat</button>
                        ) : (
                            <p className="waiting-message">Oda sahibi onayı bekleniyor...</p>
                        )}

                        <button className="close-modal" onClick={() => setShowHostWaitModal(false)}>Kapat</button>
                    </div>
                </div>
            )}

            {isDraftFinished && !isHost && !showHostWaitModal && (
                 <p className="waiting-message" style={{textAlign: 'center', margin: '20px'}}>Oda sahibi onayı bekleniyor...</p>
            )}

        </div>
    );
}

export default SquadSelection;
