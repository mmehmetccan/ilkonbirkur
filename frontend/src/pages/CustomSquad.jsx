import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import * as htmlToImage from 'html-to-image';
import '../styles/CustomSquad.css';
import { useNavigate, Link } from "react-router-dom";

const fieldPositions = { "4-3-3": { GK: ["GK"], DEF: ["RB", "CB", "CB", "LB"], MID: ["CM", "CM", "CM"], FWD: ["RW", "ST", "LW"] }, "3-5-2": { GK: ["GK"], DEF: ["CB", "CB", "CB"], MID: ["RWB", "CM", "CAM", "CM", "LWB"], FWD: ["ST", "CF"] }, "4-4-2": { GK: ["GK"], DEF: ["RB", "CB", "CB", "LB"], MID: ["RM", "CM", "CM", "LM"], FWD: ["ST", "ST"] }, "4-2-3-1": { GK: ["GK"], DEF: ["RB", "CB", "CB", "LB"], DCM: ["CDM", "CDM"], ACM: ["RM", "CAM", "LM"], FWD: ["ST"] }, "3-4-3": { GK: ["GK"], DEF: ["CB", "CB", "CB"], MID: ["RWB", "CM", "CM", "LWB"], FWD: ["RW", "ST", "LW"] }, "5-3-2": { GK: ["GK"], DEF: ["RWB", "CB", "CB", "CB", "LWB"], MID: ["CM", "CM", "CAM"], FWD: ["ST", "ST"] }, "4-5-1": { GK: ["GK"], DEF: ["RB", "CB", "CB", "LB"], MID: ["RM", "CM", "CDM", "CM", "LM"], FWD: ["ST"] }, "3-4-1-2": { GK: ["GK"], DEF: ["CB", "CB", "CB"], MID: ["RWB", "CM", "CM", "LWB"], ACM: ["CAM"], FWD: ["ST", "CF"] }, "4-3-1-2": { GK: ["GK"], DEF: ["RB", "CB", "CB", "LB"], MID: ["CM", "CDM", "CM"], ACM: ["CAM"], FWD: ["ST", "ST"] }, "4-2-2-2": { GK: ["GK"], DEF: ["RB", "CB", "CB", "LB"], DCM: ["CDM", "CDM"], ACM: ["CAM", "CAM"], FWD: ["ST", "ST"] }, "5-4-1": { GK: ["GK"], DEF: ["RWB", "CB", "CB", "CB", "LWB"], MID: ["RM", "CM", "CM", "LM"], FWD: ["ST"] } };
const customFormationOrder = { "4-2-3-1": ["GK", "DEF", "DCM", "ACM", "FWD"] };
const mapPositionToGeneral = (pos) => { if (!pos) return "MID"; const gk = ["GK", "Goalkeeper"]; const def = ["CB", "LB", "RB", "LWB", "RWB", "Defender - Centre-Back", "Defender - Left-Back", "Defender - Right-Back", "Defender"]; const dcm = ["CDM", "Defensive Midfielder", "Midfielder - Defensive Midfield"]; const acm = ["CAM", "LM", "RM", "Attacking Midfielder", "Midfielder - Attacking Midfield", "Midfielder - Right Midfield", "Midfielder - Left Midfield"]; const mid = ["CM", "Central Midfielder", "Midfielder - Central Midfield", "Wing-Back - Left Wing-Back", "Wing-Back - Right Wing-Back", "Midfielder"]; const fwd = ["ST", "CF", "LW", "RW", "Attack - Centre-Forward", "Attack - Left Winger", "Attack - Right Winger", "Attacker - Left Wing", "Attacker - Right Wing", "Forward", "Attacker"]; if (gk.some(p => pos.includes(p))) return "GK"; if (def.some(p => pos.includes(p))) return "DEF"; if (dcm.some(p => pos.includes(p))) return "DCM"; if (acm.some(p => pos.includes(p))) return "ACM"; if (mid.some(p => pos.includes(p))) return "MID"; if (fwd.some(p => pos.includes(p))) return "FWD"; return "MID"; };
const getGeneralCategoryForFilter = (pos) => { const generalPosition = mapPositionToGeneral(pos); if (["DCM", "ACM", "MID"].includes(generalPosition)) { return "MID"; } return generalPosition; };
const getPlayerForSlot = (squad, generalPos, slotIndex) => { const slotKey = `${generalPos}-${slotIndex}`; return squad.find((p) => p.assignedPosition === slotKey) || null; };
const getDisplayedSurname = (fullName) => { if (!fullName) return "Bilinmiyor"; const parts = fullName.split(" "); return parts.length > 1 ? parts[parts.length - 1] : parts[0]; };

function CustomSquad() {
    const navigate = useNavigate();
    const [mySquad, setMySquad] = useState([]);
    const [formation, setFormation] = useState("4-4-2");
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlayerDrawer, setShowPlayerDrawer] = useState(false);
    const [activeTab, setActiveTab] = useState("teamPlayers");
    const [popularTeams, setPopularTeams] = useState([]);
    const [searchedTeams, setSearchedTeams] = useState([]);
    const [teamPlayers, setTeamPlayers] = useState([]);
    const [allPlayersResult, setAllPlayersResult] = useState({ players: [], currentPage: 1, totalPages: 1 });
    const [teamSearchTerm, setTeamSearchTerm] = useState("");
    const [playerSearchTerm, setPlayerSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const fieldRef = useRef(null);

    const [showShareModal, setShowShareModal] = useState(false);
    const [squadTitle, setSquadTitle] = useState("");
    const [squadDescription, setSquadDescription] = useState("");
    const [isSharing, setIsSharing] = useState(false);

    const [latestSquads, setLatestSquads] = useState([]);


    useEffect(() => {
        const fetchPopularTeams = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/squad-builder/teams/popular`);
                setPopularTeams(response.data);
            } catch (e) {
                console.error("Error fetching popular teams:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPopularTeams();
    }, []);

    useEffect(() => {
        const fetchLatestSquads = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shared-squads?limit=4`);
                setLatestSquads(response.data.squads || response.data);
            } catch (error) {
                console.error("En son kadrolar getirilirken hata oluştu:", error);
            }
        };
        fetchLatestSquads();
    }, []);

    useEffect(() => {
        if (teamSearchTerm.trim().length < 2) {
            setSearchedTeams([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/squad-builder/teams/search?q=${teamSearchTerm}`);
                setSearchedTeams(response.data);
            } catch (e) {
                console.error("Error searching teams:", e);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [teamSearchTerm]);

    useEffect(() => {
        if (activeTab !== 'allPlayers') return;
        const delayDebounceFn = setTimeout(async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/squad-builder/players/search?q=${playerSearchTerm}&page=${currentPage}`);
                setAllPlayersResult(response.data);
            } catch (e) {
                console.error("Error searching all players:", e);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [playerSearchTerm, currentPage, activeTab]);

    useEffect(() => {
        setCurrentPage(1);
        setPlayerSearchTerm("");
        setPositionFilter("All");
    }, [activeTab]);

    const handleSelectTeam = async (team) => {
        setSelectedTeam(team);
        setTeamSearchTerm("");
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/squad-builder/players/by-team/${team.clubId}`);
            setTeamPlayers(response.data);
        } catch (error) {
            console.error("Failed to fetch team players", error);
        }
    };
    const handleSelectSlot = (generalPos, slotIndex) => {
        const specificPosition = fieldPositions[formation][generalPos][slotIndex];
        const categoryForFilter = getGeneralCategoryForFilter(specificPosition);
        setPositionFilter(categoryForFilter);
        setSelectedSlot({ generalPos, slotIndex, specificPosition });
        setActiveTab("allPlayers"); // <-- EKLENEN SATIR
        setShowPlayerDrawer(true);
    };
    const handlePickAndAssign = (playerFromDb) => {
        const assignedPositionKey = `${selectedSlot.generalPos}-${selectedSlot.slotIndex}`;
        const newPlayerForSquad = {
            player_id: playerFromDb.playerId,
            player_name: playerFromDb.playerName,
            player_image_url: playerFromDb.imageUrl,
            position: playerFromDb.position,
            club_name: selectedTeam ? selectedTeam.clubName : "Unknown",
            assignedPosition: assignedPositionKey
        };
        setMySquad((prevSquad) => {
            const newSquad = prevSquad.filter(p => p.assignedPosition !== assignedPositionKey);
            return [...newSquad, newPlayerForSquad];
        });
        closeDrawer();
    };
    const onDragEnd = (result) => { if (!result.destination) return; const { draggableId, destination } = result; setMySquad(prevSquad => { const playerToMove = prevSquad.find(p => p.player_id.toString() === draggableId); if (!playerToMove) return prevSquad; let newSquad = prevSquad.filter(p => p.player_id.toString() !== draggableId); const prevOccupant = newSquad.find(p => p.assignedPosition === destination.droppableId); if (prevOccupant) { prevOccupant.assignedPosition = null; } playerToMove.assignedPosition = destination.droppableId; newSquad.push(playerToMove); return newSquad.filter(p => p.assignedPosition !== null && p.assignedPosition !== undefined); }); };
    const handleManualEntry = () => { if (!playerSearchTerm || !selectedSlot) return; const assignedPositionKey = `${selectedSlot.generalPos}-${selectedSlot.slotIndex}`; const manualPlayer = { player_id: `manual-${Date.now()}`, player_name: playerSearchTerm, player_image_url: null, club_name: selectedTeam ? selectedTeam.clubName : "Serbest Oyuncu", position: fieldPositions[formation][selectedSlot.generalPos][selectedSlot.slotIndex], assignedPosition: assignedPositionKey, }; setMySquad((prevSquad) => { const slotOccupantIndex = prevSquad.findIndex(p => p.assignedPosition === assignedPositionKey); let newSquad = [...prevSquad]; if (slotOccupantIndex > -1) { newSquad.splice(slotOccupantIndex, 1); } return [...newSquad, manualPlayer]; }); closeDrawer(); };
    const handleRemovePlayer = (slotKey) => { setMySquad(mySquad.filter(p => p.assignedPosition !== slotKey)); };
    const closeDrawer = () => { setShowPlayerDrawer(false); setPlayerSearchTerm(""); setPositionFilter("All"); };


    const generateSquadImage = () => {
        return new Promise((resolve, reject) => {
            if (fieldRef.current === null || fieldRef.current.parentElement === null) {
                return reject(new Error('Saha elementine erişilemiyor.'));
            }

            const fieldElement = fieldRef.current;
            const wrapperElement = fieldElement.parentElement;
            const currentScrollY = window.scrollY;

            document.body.style.overflow = 'hidden';
            window.scrollTo(0, 0);

            const images = fieldElement.querySelectorAll('img');
            const loadPromises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((res, rej) => { img.onload = res; img.onerror = res; });
            });

            Promise.all(loadPromises).then(() => {
                const originalWrapperPerspective = wrapperElement.style.perspective;
                wrapperElement.style.perspective = 'none';
                fieldElement.classList.add('is-capturing');
                fieldElement.style.transform = 'scale(0.8)';

                htmlToImage.toPng(fieldElement, { quality: 0.98, scrollX: 0, scrollY: 0 })
                    .then((dataUrl) => {
                        fieldElement.style.transform = '';
                        wrapperElement.style.perspective = originalWrapperPerspective;
                        fieldElement.classList.remove('is-capturing');
                        document.body.style.overflow = '';
                        window.scrollTo(0, currentScrollY);
                        resolve(dataUrl);
                    })
                    .catch((err) => {
                        fieldElement.style.transform = '';
                        wrapperElement.style.perspective = originalWrapperPerspective;
                        fieldElement.classList.remove('is-capturing');
                        document.body.style.overflow = '';
                        window.scrollTo(0, currentScrollY);
                        reject(err);
                    });
            });
        });
    };

    const handleShare = async () => {
        try {
            const dataUrl = await generateSquadImage();
            const fileName = `Ilk11_Stabil_${formation}_${selectedTeam?.clubName || 'Kadro'}.png`;
            const link = document.createElement('a');
            link.download = fileName.replace(/ /g, '_');
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Resim indirme hatası:', err);
            alert("Resim indirilirken bir hata oluştu.");
        }
    };

    const handleSaveAndShare = async () => {
        if (!squadTitle) {
            alert("Lütfen kadronuz için bir başlık girin.");
            return;
        }
        if (mySquad.length < 11) {
            alert("Paylaşmak için en az 11 oyuncu seçmelisiniz.");
            return;
        }

        setIsSharing(true);
        const token = localStorage.getItem('token');

        try {
            const imageUrl = await generateSquadImage();

            const payload = {
                title: squadTitle,
                description: squadDescription,
                squad: mySquad,
                formation: formation,
                squadImageUrl: imageUrl
            };

            const config = { headers: { 'Content-Type': 'application/json' } };
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/shared-squads`, payload, config);

            alert("Kadronuz başarıyla paylaşıldı!");
            setShowShareModal(false);
            setSquadTitle("");
            setSquadDescription("");
            navigate(`/squads/${response.data._id}`);

        } catch (error) {
            console.error("Kadro paylaşma hatası:", error);
            alert("Kadro paylaşılırken bir hata oluştu. Lütfen konsolu kontrol edin.");
        } finally {
            setIsSharing(false);
        }
    };

    if (isLoading) {
        return <div className="loading-container">Yükleniyor...</div>;
    }

    const teamsToDisplay = teamSearchTerm.length > 1 ? searchedTeams : popularTeams;
    const baseListToFilter = activeTab === "teamPlayers"
        ? teamPlayers.filter(p => p.playerName.toLowerCase().includes(playerSearchTerm.toLowerCase()))
        : (allPlayersResult.players || []);
    const playersToRender = (activeTab === 'teamPlayers' && positionFilter !== 'All')
        ? baseListToFilter.filter(p => getGeneralCategoryForFilter(p.position) === positionFilter)
        : baseListToFilter;
    const isSlotOccupied = (generalPos, slotIndex) => getPlayerForSlot(mySquad, generalPos, slotIndex) !== null;
    const renderOrder = customFormationOrder[formation] || Object.keys(fieldPositions[formation]);
    const filterCategories = { "All": "Tümü", "GK": "Kaleci", "DEF": "Defans", "MID": "Orta Saha", "FWD": "Forvet" };


    return (
        <div className="custom-squad">
            <div className="squad-builder-container">
                <h1 className="page-title">İlk 11 Oluşturucu</h1>
                <div className="main-content-wrapper">
                    <div className="field-area-wrapper" ref={fieldRef}>
                        <div className="field-container">
                            {selectedTeam && ( <img src={selectedTeam.logoUrl ? `https://images.weserv.nl/?url=${encodeURIComponent(selectedTeam.logoUrl)}` : '/default_team_logo.png'} alt={selectedTeam.clubName} className="selected-team-logo" onError={(e) => { e.target.onerror = null; e.target.src = '/default_team_logo.png'; }} /> )}
                            <DragDropContext onDragEnd={onDragEnd}>
                                <div className="soccer-field">
                                    <div className="penalty-box top"></div><div className="six-yard-box top"></div><div className="penalty-box bottom"></div><div className="six-yard-box bottom"></div>
                                    {renderOrder.map((generalPos) => (
                                        <div className="row" key={generalPos}>
                                            {fieldPositions[formation][generalPos].map((specificPos, slotIndex) => {
                                                const player = getPlayerForSlot(mySquad, generalPos, slotIndex);
                                                const slotKey = `${generalPos}-${slotIndex}`;
                                                return (
                                                    <Droppable droppableId={slotKey} key={slotKey}>
                                                        {(provided) => (
                                                            <div ref={provided.innerRef} {...provided.droppableProps} className={`player-slot ${isSlotOccupied(generalPos, slotIndex) ? "occupied" : "empty"}`} onClick={() => handleSelectSlot(generalPos, slotIndex)}>
                                                                {player ? (
                                                                    <Draggable draggableId={player.player_id.toString()} index={0} key={player.player_id}>
                                                                        {(provided, snapshot) => (
                                                                            <div ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps} className={`player-card ${snapshot.isDragging ? 'dragging-player' : ''}`}>
                                                                                <img src={player.player_image_url ? `https://images.weserv.nl/?url=${encodeURIComponent(player.player_image_url)}` : '/default_player.png'} alt={player.player_name} onError={(e) => { e.target.onerror = null; e.target.src = '/football-player.png'; }} />
                                                                                <div className="player-name-wrapper"><div className="player-name">{getDisplayedSurname(player.player_name)}</div></div>
                                                                                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); handleRemovePlayer(slotKey); }}>X</button>
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

                    <div className="selection-sidebar">
                         <div className="formation-selection"><h3>Diziliş Seçin:</h3><div className="formation-grid">{Object.keys(fieldPositions).map((f) => (<button key={f} className={`formation-button ${formation === f ? 'active-formation' : ''}`} onClick={() => setFormation(f)}>{f}</button>))}</div></div>


                         <button onClick={() => setShowShareModal(true)} className="share-button" style={{backgroundColor: '#27ae60', borderColor: '#27ae60'}}>
                             💾 Kaydet ve Paylaş
                         </button>
                         <button onClick={handleShare} className="share-button">
                             📸 İlk 11'i PNG Olarak İndir
                         </button>
                         <>
                             {!selectedTeam && ( <div className="team-selection"><h4>Bir Takım Seçin:</h4><input type="text" placeholder="Takım Adı Ara..." value={teamSearchTerm} onChange={(e) => setTeamSearchTerm(e.target.value)} className="search-input team-search-input" /> {teamSearchTerm.length === 0 && (<h4 className="list-title">Popüler Takımlar:</h4>)} {teamSearchTerm.length > 1 && searchedTeams.length === 0 && (<p>Aradığınız takım bulunamadı.</p>)} <div className="team-logo-list">{teamsToDisplay.map(team => ( <div key={team.clubId} className="team-logo-wrapper" onClick={() => handleSelectTeam(team)}> <img src={team.logoUrl ? `https://images.weserv.nl/?url=${encodeURIComponent(team.logoUrl)}` : '/default_team_logo.png'} alt={team.clubName} className="team-logo" onError={(e) => { e.target.onerror = null; e.target.src = '/default_team_logo.png'; }} /> <span className="team-name-overlay">{team.clubName}</span> </div> ))}</div> </div> )}
                             {selectedTeam && ( <div className="selected-team-info"><div className="team-header"><img src={selectedTeam.logoUrl ? `https://images.weserv.nl/?url=${encodeURIComponent(selectedTeam.logoUrl)}` : '/default_team_logo.png'} alt={selectedTeam.clubName} className="sidebar-team-logo" onError={(e) => { e.target.onerror = null; e.target.src = '/default_team_logo.png'; }} /><h4>Seçilen Takım: {selectedTeam.clubName}</h4><button onClick={() => {setSelectedTeam(null); setTeamPlayers([]);}} className="change-team-btn">Takımı Değiştir</button></div><p>Oyuncu seçimi için saha slotuna tıklayın.</p></div> )}
                         </>
                    </div>
                </div>

                <div className={`player-selection-drawer ${showPlayerDrawer ? 'is-open' : ''}`}>
                    <div className="drawer-content">
                        <div className="drawer-header">
                           <div><h3>Oyuncu Seçimi</h3><p>Mevki: <span>{selectedSlot?.specificPosition || ''}</span></p></div>
                           <button className="close-drawer-btn" onClick={closeDrawer}>×</button>
                        </div>
                        <div className="drawer-controls">
                            <input
                                type="text"
                                placeholder="Oyuncu ara..."
                                value={playerSearchTerm}
                                onChange={(e) => setPlayerSearchTerm(e.target.value)}
                                className="drawer-search-input"
                            />
                            <div className="tabs">
                                <button className={`tab-button ${activeTab === 'allPlayers' ? 'active' : ''}`}
                                        onClick={() => setActiveTab("allPlayers")}>Tüm Oyuncular
                                </button>

                                <button className={`tab-button ${activeTab === 'teamPlayers' ? 'active' : ''}`}
                                        onClick={() => setActiveTab("teamPlayers")}
                                        disabled={!selectedTeam}>{selectedTeam?.clubName || "Takım"}</button>
                            </div>
                            {activeTab === 'teamPlayers' && (
                                <div className="position-filter-container">
                                    {Object.entries(filterCategories).map(([key, value]) => (
                                        <button
                                            key={key}
                                            className={`position-filter-button ${positionFilter === key ? 'active' : ''}`}
                                            onClick={() => setPositionFilter(key)}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="player-grid-container">
                            {playersToRender.length > 0 ? (
                                <div className="player-grid">
                                    {playersToRender.map((p) => (
                                        <div key={p.playerId.toString()} className="player-card-item" onClick={() => handlePickAndAssign(p)}>
                                            <img src={p.imageUrl ? `https://images.weserv.nl/?url=${encodeURIComponent(p.imageUrl)}` : '/default_player.png'} alt={p.playerName} onError={(e) => { e.target.onerror = null; e.target.src = '/default_player.png'; }} />
                                            <div className="player-card-info"><span className="player-card-name">{p.playerName}</span><span className="player-card-position">{p.position}</span></div>
                                        </div>
                                    ))}
                                </div>
                            ) : ( <div className="no-player-found"><p>Aradığınız kritere uygun oyuncu bulunamadı.</p></div> )}
                        </div>
                        <div className="drawer-footer">
                             {activeTab === "allPlayers" && allPlayersResult.totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={allPlayersResult.currentPage === 1}>&larr;</button>
                                    <span>{allPlayersResult.currentPage} / {allPlayersResult.totalPages}</span>
                                    <button onClick={() => setCurrentPage(prev => Math.min(allPlayersResult.totalPages, prev + 1))} disabled={allPlayersResult.currentPage === allPlayersResult.totalPages}>&rarr;</button>
                                </div>
                            )}
                            <div className="manual-entry"><button onClick={handleManualEntry} disabled={!playerSearchTerm.trim()}>"{playerSearchTerm}" olarak ekle</button></div>
                        </div>
                    </div>
                </div>
                {showPlayerDrawer && <div className="drawer-overlay" onClick={closeDrawer}></div>}

            </div>

            {showShareModal && (
                <div className="share-modal-overlay">
                    <div className="share-modal-content">
                        <h2>Kadro Paylaş</h2>
                        <div className="form-group">
                            <label htmlFor="squadTitle">Başlık</label>
                            <input
                                type="text"
                                id="squadTitle"
                                placeholder="Örn: Yenilmez Armada, 2025 Şampiyonu..."
                                value={squadTitle}
                                onChange={(e) => setSquadTitle(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="squadDescription">Açıklama (İsteğe Bağlı)</label>
                            <textarea
                                id="squadDescription"
                                placeholder="Bu kadro neden özel? Taktiksel analiziniz..."
                                value={squadDescription}
                                onChange={(e) => setSquadDescription(e.target.value)}
                                rows="4"
                            ></textarea>
                        </div>
                        <div className="share-modal-actions">
                            <button onClick={() => setShowShareModal(false)} className="btn-secondary">İptal</button>
                            <button onClick={handleSaveAndShare} className="btn-primary" disabled={isSharing}>
                                {isSharing ? 'Oluşturuluyor...' : 'Paylaş'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="latest-squads-section">
                <h2 className="section-title">Son Paylaşılan Kadrolar</h2>
                <div className="squads-grid">
                    {latestSquads.map(squad => (
                        <Link to={`/squads/${squad._id}`} key={squad._id} className="squad-card">
                            <img
                                src={squad.squadImageUrl}
                                alt={squad.title}
                                className="squad-card-image"
                                loading="lazy"
                            />
                            <div className="squad-card-info">
                                <h3 className="squad-card-title">{squad.title}</h3>
                                <p className="squad-card-author">Paylaşan: {squad.authorName}</p>
                            </div>
                        </Link>
                    ))}
                </div>
                <Link to="/squads" className="btn-view-all">
                    Tüm Paylaşılan Kadroları Gör
                </Link>
            </div>
        </div>
    );
}

export default CustomSquad;