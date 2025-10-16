// frontend/src/pages/SinglePlayerMatch.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import io from "socket.io-client";
import "../styles/SinglePlayerMatch.css";

const socket = io(import.meta.env.VITE_API_URL);

const StatBar = ({ label, valA, valB, teamA, teamB, isPercentage = false }) => {
    const numericValA = isPercentage ? parseFloat(valA) || 0 : parseInt(valA, 10) || 0;
    const numericValB = isPercentage ? parseFloat(valB) || 0 : parseInt(valB, 10) || 0;
    const total = isPercentage ? 100 : numericValA + numericValB;
    let percentA = isPercentage ? numericValA : (total > 0 ? (numericValA / total) * 100 : 50);

    return (
        <div className="stat-bar">
            <div className="stat-bar-header">
                <span>{teamA}</span>
                <span>{label}</span>
                <span>{teamB}</span>
            </div>
            <div className="stat-bar-values">
                <span className={numericValA > numericValB ? 'highlight-a' : ''}>{valA}{isPercentage ? '%' : ''}</span>
                <span className={numericValB > numericValA ? 'highlight-b' : ''}>{valB}{isPercentage ? '%' : ''}</span>
            </div>
            <div className="stat-bar-progress">
                <div style={{ width: `${percentA}%` }} className="stat-a"></div>
                <div style={{ width: `${100 - percentA}%` }} className="stat-b"></div>
            </div>
        </div>
    );
};

const fieldPositions = {
    "4-4-2": { FWD: ["ST", "ST"], MID: ["RM", "CM", "CM", "LM"], DEF: ["RB", "CB", "CB", "LB"], GK: ["GK"] },
    "4-3-3": { FWD: ["LW", "ST", "RW"], MID: ["CM", "CM", "CM"], DEF: ["LB", "CB", "CB", "RB"], GK: ["GK"] },
    "3-5-2": { FWD: ["ST", "CF"], MID: ["LM", "CM", "CAM", "CM", "RM"], DEF: ["LCB", "CB", "RCB"], GK: ["GK"] },
    "4-2-3-1": { FWD: ["ST"], ACM: ["LW", "CAM", "RW"], DCM: ["CDM", "CDM"], DEF: ["LB", "CB", "CB", "RB"], GK: ["GK"] },
    "5-3-2": { FWD: ["ST", "ST"], MID: ["CM", "CAM", "CM"], DEF: ["LWB", "LCB", "CB", "RCB", "RWB"], GK: ["GK"] }
};

const customFormationOrder = { "4-2-3-1": ["GK", "DEF", "DCM", "ACM", "FWD"] };
const POSITIONS = { Tümü: "All", Kaleci: "GK", Defans: "DEF", "Orta Saha": "MID", Forvet: "FWD" };
const TOP_LEAGUES = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Süper Lig"];

const getPlayerForSlot = (squad, generalPos, slotIndex) => {
    const slotKey = `${generalPos}-${slotIndex}`;
    return squad.find((p) => p.assignedPosition === slotKey) || null;
};

const getDisplayedSurname = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.split(" ");
    return parts[parts.length - 1];
};

const SinglePlayerMatch = () => {
    const [gameState, setGameState] = useState("select_team");
    const [allTeams, setAllTeams] = useState([]);
    const [teamSearchTerm, setTeamSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOpponent, setSelectedOpponent] = useState(null);
    const [mySquad, setMySquad] = useState([]);

    const [isMatchSimulating, setIsMatchSimulating] = useState(false);
    const [currentMinute, setCurrentMinute] = useState(0);
    const [liveScore, setLiveScore] = useState({ A: 0, B: 0 });
    const [liveStats, setLiveStats] = useState({
        teamA: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 },
        teamB: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 }
    });
    const [liveCommentary, setLiveCommentary] = useState([]);

    const [allPlayersResult, setAllPlayersResult] = useState({ players: [], currentPage: 1, totalPages: 1 });
    const [playerSearchTerm, setPlayerSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
    const [showPlayerDrawer, setShowPlayerDrawer] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [positionFilter, setPositionFilter] = useState("All");

    const [formation, setFormation] = useState("4-4-2");
    const fieldRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const squadPlayerIds = useMemo(() => new Set(mySquad.map(p => p.player_id)), [mySquad]);


    useEffect(() => {
        socket.on("connect", () => console.log("Socket bağlandı:", socket.id));
        socket.on("disconnect", () => console.log("Socket bağlantısı kesildi"));

        socket.on("matchEvent", (event, score, stats, minute) => {
            if (score) setLiveScore(score);
            if (stats) setLiveStats(stats);
            if (minute) setCurrentMinute(minute);

            let msg = "";
            switch (event.type) {
                case "start":
                    setLiveCommentary(prev => [event.message, ...prev]);
                    break;
                case "goal":
                    msg = `⚽ GOLLL! ${event.team} - ${event.scorer}`;
                    setLiveCommentary(prev => [`${minute}' - ${msg}`, ...prev]);
                    break;
                case "save":
                    msg = `🧤 Harika kurtarış! Kaleci ${event.player} gole izin vermedi.`;
                    setLiveCommentary(prev => [`${minute}' - ${msg}`, ...prev]);
                    break;
                case "miss":
                    msg = `⬆️ ${event.team}: ${event.player} topu dışarı yolladı.`;
                    setLiveCommentary(prev => [`${minute}' - ${msg}`, ...prev]);
                    break;
                case "end":
                    setIsMatchSimulating(false);
                    setLiveCommentary(prev => [event.message, ...prev]);
                    break;
                default:
                    break;
            }
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("matchEvent");
        };
    }, []);

    useEffect(() => {
        const fetchAllTeams = async () => {
            setIsLoading(true);
            try {
                const { data } = await axios.get(`${API_URL}/api/single-player/teams`);
                setAllTeams(Array.isArray(data) ? data : []);
            } catch (error) { console.error("Tüm takımlar getirilemedi:", error); }
            finally { setIsLoading(false); }
        };
        fetchAllTeams();
    }, [API_URL]);

    useEffect(() => {
        if (!showPlayerDrawer) return;
        const controller = new AbortController();
        const fetchData = async () => {
            setIsLoadingPlayers(true);
            try {
                const { data } = await axios.get(`${API_URL}/api/single-player/players`, {
                    params: { page: currentPage, limit: 24, search: playerSearchTerm, position: positionFilter },
                    signal: controller.signal
                });
                if (data && Array.isArray(data.players)) setAllPlayersResult(data);
            } catch (error) {
                if (error.name !== 'CanceledError') console.error(error);
            } finally { setIsLoadingPlayers(false); }
        };
        const debounceFetch = setTimeout(() => fetchData(), 300);
        return () => {
            clearTimeout(debounceFetch);
            controller.abort();
        };
    }, [currentPage, playerSearchTerm, positionFilter, showPlayerDrawer, API_URL]);

    const handleSimulate = async () => {
        if (mySquad.length < 11 || !socket.id) {
            alert("Kadro eksik veya sunucu bağlantısı yok!");
            return;
        }
        setIsLoading(true);
        setLiveCommentary([]);
        setCurrentMinute(0);
        setLiveScore({ A: 0, B: 0 });
        setLiveStats({ teamA: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 }, teamB: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 } });

        try {
            await axios.post(`${API_URL}/api/single-player/simulate`, {
                mySquad,
                opponentTeamId: selectedOpponent.clubId,
                socketId: socket.id
            });
            setIsLoading(false);
            setGameState("simulating");
            setIsMatchSimulating(true);
        } catch (error) {
            alert("Simülasyon başlatılırken hata oluştu!");
            setIsLoading(false);
        }
    };

    const handlePlayAgain = () => {
        setGameState("select_team");
        setMySquad([]);
        setTeamSearchTerm("");
        setIsMatchSimulating(false);
        setLiveCommentary([]);
        setCurrentMinute(0);
    };

    const handleTeamSelect = (team) => {
        setSelectedOpponent(team);
        setGameState("build_squad");
    };

    const handleSelectSlot = (generalPos, slotIndex) => {
        const specificPosition = fieldPositions[formation][generalPos][slotIndex];
        setSelectedSlot({ generalPos, slotIndex, specificPosition });
        setShowPlayerDrawer(true);
    };

    const handlePickAndAssign = (player) => {
        if (!selectedSlot) return;
        const key = `${selectedSlot.generalPos}-${selectedSlot.slotIndex}`;
        const newPlayer = { ...player, assignedPosition: key };
        setMySquad((prevSquad) => [...prevSquad.filter((p) => p.assignedPosition !== key), newPlayer]);
        closeDrawer();
    };

    const closeDrawer = () => {
        setShowPlayerDrawer(false);
        setPlayerSearchTerm("");
        setPositionFilter("All");
        setCurrentPage(1);
    };

    const handleRemovePlayer = (slotKey) => setMySquad(mySquad.filter((p) => p.assignedPosition !== slotKey));

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        setMySquad((prev) => {
            const newSquad = [...prev];
            const playerToMove = newSquad.find(p => p.player_id.toString() === draggableId);
            if (!playerToMove) return prev;
            const occupantInDestination = newSquad.find(p => p.assignedPosition === destination.droppableId);
            if (occupantInDestination) occupantInDestination.assignedPosition = source.droppableId;
            playerToMove.assignedPosition = destination.droppableId;
            return newSquad;
        });
    };

    const filteredTeams = allTeams.filter((team) => team.clubName.toLowerCase().includes(teamSearchTerm.toLowerCase()));
    const isSlotOccupied = (generalPos, slotIndex) => mySquad.some(p => p.assignedPosition === `${generalPos}-${slotIndex}`);
    const renderOrder = customFormationOrder[formation] || Object.keys(fieldPositions[formation]).reverse();

    const getVisiblePages = () => {
        const total = allPlayersResult.totalPages;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(total, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const renderTeamSelection = () => (
        <div className="spm-league-container">
            <h1>Rakip Takım Seç</h1>
            <input type="text" placeholder="Takım ara..." value={teamSearchTerm} onChange={(e) => setTeamSearchTerm(e.target.value)} className="spm-drawer-search-input" />
            {isLoading ? <div className="spm-loading-container">Takımlar yükleniyor...</div> : (
                <>
                    {TOP_LEAGUES.map((leagueName) => {
                        const teamsInLeague = filteredTeams.filter((t) => t.leagueName === leagueName);
                        if (teamSearchTerm && teamsInLeague.length === 0) return null;
                        return (
                            <div key={leagueName} className="spm-league-section">
                                <h2 className="spm-league-title">{leagueName}</h2>
                                <div className="spm-team-buttons-grid">
                                    {teamsInLeague.map((team) => (<button key={team.clubId} className="spm-team-button" onClick={() => handleTeamSelect(team)}>{team.clubName}</button>))}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );

    const renderSquadBuilder = () => (
        <div className="spm-squad-builder">
            <h1>Kendi Takımını Kur</h1>
            <p className="spm-opponent">Rakip: {selectedOpponent.clubName}</p>
            <div className="spm-formation-selection">
                <h3>Diziliş Seçin:</h3>
                <div className="spm-formation-grid">
                    {Object.keys(fieldPositions).map((f) => (<button key={f} className={`spm-formation-button ${formation === f ? 'active' : ''}`} onClick={() => setFormation(f)}>{f}</button>))}
                </div>
            </div>
            <div className="spm-field-area-wrapper" ref={fieldRef}>
                <div className="spm-field-container">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="soccer-field">
                            <div className="spm-penalty-box top"></div>
                            <div className="spm-six-yard-box top"></div>

                            <div className="spm-penalty-box bottom"></div>
                            <div className="spm-six-yard-box bottom"></div>
                            {renderOrder.map((generalPos) => (
                                <div className="row" key={generalPos}>
                                    {fieldPositions[formation][generalPos].map((specificPos, slotIndex) => {
                                        const player = getPlayerForSlot(mySquad, generalPos, slotIndex);
                                        const slotKey = `${generalPos}-${slotIndex}`;
                                        return (
                                            <Droppable droppableId={slotKey} key={slotKey}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.droppableProps}
                                                         className={`player-slot ${isSlotOccupied(generalPos, slotIndex) ? "occupied" : "empty"}`}
                                                         onClick={() => handleSelectSlot(generalPos, slotIndex)}>
                                                        {player ? (
                                                            <Draggable draggableId={player.player_id.toString()}
                                                                       index={0} key={player.player_id}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}
                                                                        className={`player-card`}>
                                                                        <img
                                                                            src={player.player_face_url ? `https://images.weserv.nl/?url=${encodeURIComponent(player.player_face_url)}` : '/default_player.png'}
                                                                            alt={player.short_name}/>
                                                                        <div className="player-name-wrapper">
                                                                            <div
                                                                                className="player-name">{getDisplayedSurname(player.short_name)}</div>
                                                                        </div>
                                                                        <button className="remove-btn" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemovePlayer(slotKey);
                                                                        }}>X
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ) : (<div className="empty-slot-text">{specificPos}</div>)}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </DragDropContext>
                </div>
            </div>
            <button onClick={handleSimulate} disabled={mySquad.length < 11 || isLoading} className="spm-share-button">
                {isLoading ? 'Başlatılıyor...' : (mySquad.length < 11 ? `${11 - mySquad.length} oyuncu daha seç` : "Maçı Simüle Et")}
            </button>
        </div>
    );

    const renderLiveMatch = () => (
        <div className="spm-match-result-container">
            <h3>⚡ Canlı Maç</h3>

            <div className="live-match-header">
                <div className="team-info team-a">
                    <span className="team-name">Senin Takımın</span>
                    <span className="score">{liveScore.A}</span>
                </div>
                <div className="match-status">
                    <span className="minute">{currentMinute}'</span>
                    <span className="half-status">{currentMinute < 45 ? "1. Devre" : (currentMinute < 90 ? "2. Devre" : "Maç Bitti")}</span>
                </div>
                <div className="team-info team-b">
                    <span className="score">{liveScore.B}</span>
                    <span className="team-name">{selectedOpponent.clubName}</span>
                </div>
            </div>

            <div className="live-stats">
                <StatBar label="Topa Sahip Olma" valA={liveStats.teamA.possession} valB={liveStats.teamB.possession} teamA="Sen" teamB="Rakip" isPercentage={true}/>
                <StatBar label="Şut (Toplam)" valA={liveStats.teamA.shots} valB={liveStats.teamB.shots} teamA="Sen" teamB="Rakip"/>
                <StatBar label="Şut (İsabet)" valA={liveStats.teamA.shotsOnTarget} valB={liveStats.teamB.shotsOnTarget} teamA="Sen" teamB="Rakip"/>
                <StatBar label="Korner" valA={liveStats.teamA.corners} valB={liveStats.teamB.corners} teamA="Sen" teamB="Rakip"/>
                <StatBar label="Kurtarış" valA={liveStats.teamA.saves} valB={liveStats.teamB.saves} teamA="Sen" teamB="Rakip"/>
                <StatBar label="Faul" valA={liveStats.teamA.fouls} valB={liveStats.teamB.fouls} teamA="Sen" teamB="Rakip"/>
            </div>

            <div className="live-commentary-box">
                <h3>📝 Canlı Anlatım</h3>
                <ul className="commentary-list">
                    {liveCommentary.map((c, i) => (
                        <li key={i} className="commentary-item">{c}</li>
                    ))}
                </ul>
            </div>

            {currentMinute >= 90 && !isMatchSimulating && (
                <button onClick={handlePlayAgain} className="spm-share-button">Tekrar Oyna</button>
            )}
        </div>
    );

    const renderPlayerDrawer = () => (
        <>
            <div className={`spm-player-selection-drawer ${showPlayerDrawer ? 'is-open' : ''}`}>
                <div className="spm-drawer-content">
                    <div className="spm-drawer-header">
                        <div><h3>Oyuncu Seçimi</h3><p>Mevki: <span>{selectedSlot?.specificPosition || ''}</span></p></div>
                        <button className="spm-close-drawer-btn" onClick={closeDrawer}>×</button>
                    </div>
                    <div className="spm-drawer-controls">
                        <input type="text" placeholder="Oyuncu ara..." value={playerSearchTerm} onChange={(e) => { setPlayerSearchTerm(e.target.value); setCurrentPage(1); }} className="spm-drawer-search-input-dark" />
                        <div className="spm-position-filters">
                            {Object.entries(POSITIONS).map(([displayName, value]) => (
                                <button key={value} className={`spm-filter-button ${positionFilter === value ? "active" : ""}`} onClick={() => { setPositionFilter(value); setCurrentPage(1); }}>{displayName}</button>
                            ))}
                        </div>
                    </div>
                    <div className="spm-player-grid-container">
                        {isLoadingPlayers ? <div className="spm-loading-container">Oyuncular Yükleniyor...</div> : (
                            allPlayersResult.players.length > 0 ? (
                                <div className="spm-player-grid">
                                    {/* YENİ: Oyuncuları listelemeden önce kadroda olup olmadıklarını kontrol et */}
                                    {allPlayersResult.players
                                        .filter(p => !squadPlayerIds.has(p.player_id))
                                        .map((p) => (
                                        <div key={p.player_id.toString()} className="spm-player-card-item" onClick={() => handlePickAndAssign(p)}>
                                            <img src={p.player_face_url ? `https://images.weserv.nl/?url=${encodeURIComponent(p.player_face_url)}` : '/default_player.png'} alt={p.short_name} />
                                            <div className="spm-player-card-info">
                                                <span className="spm-player-card-name">{p.short_name}</span>
                                                <span className="spm-player-card-position">{p.player_positions}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="spm-no-player-found"><p>Aradığınız kritere uygun oyuncu bulunamadı.</p></div>
                        )}
                    </div>
                    <div className="spm-pagination-controls">
                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>&larr;</button>
                        {getVisiblePages().map(p => (<button key={p} className={`spm-page-button ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>))}
                        <button onClick={() => setCurrentPage(prev => Math.min(allPlayersResult.totalPages, prev + 1))} disabled={currentPage === allPlayersResult.totalPages}>&rarr;</button>
                    </div>
                </div>
            </div>
            {showPlayerDrawer && <div className="spm-drawer-overlay" onClick={closeDrawer}></div>}
        </>
    );

    return (
        <div className="spm-container">
            {gameState === "select_team" && renderTeamSelection()}
            {gameState === "build_squad" && renderSquadBuilder()}
            {gameState === "simulating" && renderLiveMatch()}
            {renderPlayerDrawer()}
        </div>
    );
};

export default SinglePlayerMatch;