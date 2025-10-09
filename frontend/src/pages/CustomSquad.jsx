// frontend/src/pages/CustomSquad.jsx
import React, { useEffect, useState, useRef } from "react"; // useRef eklendi
import axios from "axios";
import io from "socket.io-client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import * as htmlToImage from 'html-to-image'; // html-to-image kütüphanesi eklendi
import '../styles/CustomSquad.css'; // YENİ: CSS dosyasını import et

const socket = io(); // Kendi socket sunucunuza göre ayarlayın

// Saha dizilişleri ve pozisyon slotları (4-2-3-1 DÜZELTİLDİ)
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
        MID: ["RWB", "CM", "CAM", "CM", "LWB"],
        FWD: ["ST", "CF"],
    },
    "4-4-2": {
        GK: ["GK"],
        DEF: ["RB", "CB", "CB", "LB"],
        MID: ["RM", "CM", "CM", "LM"],
        FWD: ["ST", "ST"],
    },
    "4-2-3-1": { // YENİ DÜZEN: İki ayrı orta saha sırası DCM ve ACM olarak ayrıldı
        GK: ["GK"],
        DEF: ["RB", "CB", "CB", "LB"],
        DCM: ["CDM", "CDM"], // Defansif Orta Saha (2'li kısım)
        ACM: ["RM", "CAM", "LM"], // Ofansif Orta Saha (3'lü kısım)
        FWD: ["ST"],
    },
    "3-4-3": {
        GK: ["GK"],
        DEF: ["CB", "CB", "CB"],
        MID: ["RWB", "CM", "CM", "LWB"],
        FWD: ["RW", "ST", "LW"],
    },
    "5-3-2": {
        GK: ["GK"],
        DEF: ["RWB", "CB", "CB", "CB", "LWB"],
        MID: ["CM", "CM", "CAM"],
        FWD: ["ST", "ST"],
    },
    "4-1-2-1-2": {
        GK: ["GK"],
        DEF: ["RB", "CB", "CB", "LB"],
        MID: ["CDM", "RM", "LM", "CAM"],
        FWD: ["ST", "ST"],
    },

    // 2️⃣ 4-5-1 (Defansif Orta Saha Ağırlıklı)
    "4-5-1": {
        GK: ["GK"],
        DEF: ["RB", "CB", "CB", "LB"],
        MID: ["RM", "CM", "CDM", "CM", "LM"],
        FWD: ["ST"],
    },

    // 3️⃣ 3-4-1-2 (Ofansif Merkezli)
    "3-4-1-2": {
        GK: ["GK"],
        DEF: ["CB", "CB", "CB"],
        MID: ["RWB", "CM", "CM", "LWB"],
        ACM: ["CAM"],
        FWD: ["ST", "CF"],
    },

    // 4️⃣ 4-3-1-2 (Dar Orta Saha + CAM)
    "4-3-1-2": {
        GK: ["GK"],
        DEF: ["RB", "CB", "CB", "LB"],
        MID: ["CM", "CDM", "CM"],
        ACM: ["CAM"],
        FWD: ["ST", "ST"],
    },

    // 5️⃣ 4-2-2-2 (Dengeli ve Güçlü)
    "4-2-2-2": {
        GK: ["GK"],
        DEF: ["RB", "CB", "CB", "LB"],
        DCM: ["CDM", "CDM"],
        ACM: ["CAM", "CAM"],
        FWD: ["ST", "ST"],
    },

    // 6️⃣ 5-4-1 (Katı Defans)
    "5-4-1": {
        GK: ["GK"],
        DEF: ["RWB", "CB", "CB", "CB", "LWB"],
        MID: ["RM", "CM", "CM", "LM"],
        FWD: ["ST"],
    }
};

// Dizilişler için custom render sırası (özellikle 4-2-3-1 için)
const customFormationOrder = {
    "4-2-3-1": ["GK", "DEF", "DCM", "ACM", "FWD"], // Yeni sıralama
};


// Pozisyonları ana gruplarına eşleyen fonksiyon (4-2-3-1'e göre güncellendi)
const mapPositionToGeneral = (pos) => {
    if (!pos) return "MID";
    const gk = ["GK", "Goalkeeper"];
    const def = ["CB", "LB", "RB", "LWB", "RWB", "Defender - Centre-Back", "Defender - Left-Back", "Defender - Right-Back", "Defender"];

    // YENİ EKLEMELER
    const dcm = ["CDM", "Defensive Midfielder", "Midfielder - Defensive Midfield"];
    const acm = ["CAM", "LM", "RM", "Attacking Midfielder", "Midfielder - Attacking Midfield", "Midfielder - Right Midfield", "Midfielder - Left Midfield"];
    // YENİ EKLEMELER SONU

    const mid = ["CM", "Central Midfielder", "Midfielder - Central Midfield", "Wing-Back - Left Wing-Back", "Wing-Back - Right Wing-Back", "Midfielder"];
    const fwd = ["ST", "CF", "LW", "RW", "Attack - Centre-Forward", "Attack - Left Winger", "Attack - Right Winger", "Attacker - Left Wing", "Attacker - Right Wing", "Forward", "Attacker"];

    if (gk.some(p => pos.includes(p))) return "GK";
    if (def.some(p => pos.includes(p))) return "DEF";

    // 4-2-3-1 için özel eşleştirme (CDM -> DCM, CAM/LM/RM -> ACM)
    if (dcm.some(p => pos.includes(p))) return "DCM";
    if (acm.some(p => pos.includes(p))) return "ACM";

    // Geri kalan geleneksel orta saha pozisyonları MID olarak kalır (4-4-2, 4-3-3 vb. için)
    if (mid.some(p => pos.includes(p))) return "MID";

    if (fwd.some(p => pos.includes(p))) return "FWD";
    return "MID"; // Varsayılan olarak Midfielder
};

// Slot bazlı oyuncu bulma fonksiyonu
const getPlayerForSlot = (squad, generalPos, slotIndex) => {
    const slotKey = `${generalPos}-${slotIndex}`;
    return squad.find((p) => p.assignedPosition === slotKey) || null;
};

// --- YARDIMCI İSİM AYRIŞTIRMA FONKSİYONLARI ---

// Oyuncu adından parantez içindeki ID'yi siler (Örn: "Mauro Icardi (68863)" -> "Mauro Icardi")
const getNameWithoutId = (fullName) => {
    if (!fullName) return "Bilinmiyor";
    // Parantez içindeki boşluk ve rakam grubunu siler
    return fullName.replace(/\s\(\d+\)$/, '').trim();
};

// Takım adından parantez içindeki ID'yi siler (Örn: "Galatasaray (141)" -> "Galatasaray")
const getClubNameWithoutId = (clubName) => {
    if (!clubName) return "Bilinmiyor";
    // Parantez içindeki boşluk ve rakam grubunu siler
    return clubName.replace(/\s\(\d+\)$/, '').trim();
};

// Saha için soyismi (veya tek kelimeyse tüm adı) döndürür (Örn: "Mauro Icardi" -> "Icardi")
const getDisplayedSurname = (fullName) => {
    const name = getNameWithoutId(fullName);
    const parts = name.split(" ");

    // Eğer birden fazla kelime varsa son kelimeyi (soyisim) al, yoksa tek kelimeyi al.
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

function CustomSquad() {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [formation, setFormation] = useState("4-4-2"); // Varsayılan bir dizilişle başla
    const [mySquad, setMySquad] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    const [activeTab, setActiveTab] = useState("teamPlayers");
    const [isLoading, setIsLoading] = useState(true);
    const [teamSearchTerm, setTeamSearchTerm] = useState("");
    const [isDownloaded, setIsDownloaded] = useState(false); // Buton durumunu takip eder

    // Resim indirme için saha elementine referans
    const fieldRef = useRef(null);

    // Sayfalama State'leri
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 20; // Her sayfada 20 oyuncu

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/players/initial`);

                const playersData = response.data.players;
                const teamsData = response.data.teams;

                setPlayers(Array.isArray(playersData) ? playersData : []);
                setTeams(Array.isArray(teamsData) ? teamsData : []);
            } catch (e) {
                console.error("Veri yükleme hatası:", e);
                setPlayers([]);
                setTeams([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);


    // Sayfa Sıfırlama Effect'i
    useEffect(() => {
        // Arama veya sekme değiştiğinde sayfayı sıfırla
        setCurrentPage(1);
    }, [searchTerm, activeTab]);


    if (isLoading) {
        return <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>Oyuncular ve Takımlar Yükleniyor...</div>;
    }

    // --- TAKIM FİLTRELEME MANTIĞI ---
    const sortedTeams = [...teams].sort((a, b) => a.club_id - b.club_id);
    const top10Teams = sortedTeams.slice(0, 10);
    const filteredTeams = teams.filter(team =>
        getClubNameWithoutId(team.club_name).toLowerCase().includes(teamSearchTerm.toLowerCase())
    );
    const teamsToDisplay = teamSearchTerm.length > 0 ? filteredTeams : top10Teams;
    // --- TAKIM FİLTRELEME MANTIĞI SONU ---


    const handleSelectSlot = (generalPos, slotIndex) => {
        if (mySquad.length < 11 || getPlayerForSlot(mySquad, generalPos, slotIndex)) { // Dolu slota da tıklanabilir
            setSelectedSlot({ generalPos, slotIndex });
            setShowPlayerModal(true);
        }
    };

    const handlePickAndAssign = (player) => {
        const assignedPositionKey = `${selectedSlot.generalPos}-${selectedSlot.slotIndex}`;
        const newPlayer = { ...player, assignedPosition: assignedPositionKey };

        setMySquad((prevSquad) => {
            const slotOccupantIndex = prevSquad.findIndex(p => p.assignedPosition === assignedPositionKey);
            let newSquad = [...prevSquad];

            if (slotOccupantIndex > -1) {
                newSquad.splice(slotOccupantIndex, 1);
            }

            return [...newSquad, newPlayer];
        });

        setSearchTerm(""); // Seçim sonrası arama terimini temizle
        setSelectedSlot(null);
        setShowPlayerModal(false);
    };

    const handleManualEntry = () => {
        if (!searchTerm || !selectedSlot) return;

        const assignedPositionKey = `${selectedSlot.generalPos}-${selectedSlot.slotIndex}`;

        const manualPlayer = {
            player_id: `manual-${Date.now()}`,
            player_name: searchTerm,
            player_image_url: null, // Varsayılan resim kullanılacak
            club_name: selectedTeam ? getClubNameWithoutId(selectedTeam.club_name) : "Serbest Oyuncu",
            position: fieldPositions[formation][selectedSlot.generalPos][selectedSlot.slotIndex],
            assignedPosition: assignedPositionKey,
        };

        setMySquad((prevSquad) => {
            const slotOccupantIndex = prevSquad.findIndex(p => p.assignedPosition === assignedPositionKey);
            let newSquad = [...prevSquad];

            if (slotOccupantIndex > -1) {
                newSquad.splice(slotOccupantIndex, 1);
            }

            return [...newSquad, manualPlayer];
        });

        setSearchTerm("");
        setSelectedSlot(null);
        setShowPlayerModal(false);
    };

    const handleRemovePlayer = (slotKey) => {
        setMySquad(mySquad.filter(p => p.assignedPosition !== slotKey));
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;

        setMySquad(prevSquad => {
            const playerToMove = prevSquad.find(p => p.player_id.toString() === draggableId);
            if (!playerToMove) return prevSquad;

            let newSquad = prevSquad.filter(p => p.player_id.toString() !== draggableId);

            // Hedef slottaki mevcut oyuncuyu serbest bırak
            const prevOccupant = newSquad.find(p => p.assignedPosition === destination.droppableId);
            if (prevOccupant) {
                // Eğer hedef slotta başka bir oyuncu varsa, onun assignedPosition'ını null yap
                prevOccupant.assignedPosition = null;
            }

            playerToMove.assignedPosition = destination.droppableId;
            newSquad.push(playerToMove);

            return newSquad.filter(p => p.assignedPosition !== null && p.assignedPosition !== undefined);
        });
    };

    /**
     * Sahadaki görselin PNG olarak indirilmesini sağlar.
     * Stilleri inline olarak kaydedip geri yüklemek yerine, CSS'ten gelen orijinal
     * değerleri garantili bir şekilde geri yükler. Bu, tekrar eden çekimlerdeki kaymayı çözer.
     */
  const handleShare = () => {
    if (fieldRef.current === null || fieldRef.current.parentElement === null) {
        console.error('Saha elementine veya üst kapsayıcısına erişilemiyor.');
        return;
    }

    const fieldElement = fieldRef.current;
    const wrapperElement = fieldElement.parentElement; // .field-area-wrapper

    // --- YENİ EKLENTİ: KAYDIRMA KONUMUNU KAYDET ---
    const currentScrollY = window.scrollY;

    // Geçici olarak kaydırmayı engelle ve tarayıcıyı en üste kaydır.
    // Bu, görsel yakalama sırasında beklenmedik kaymaları önler.
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    // Resimlerin yüklenmesini bekleme
    const images = fieldElement.querySelectorAll('img');
    const loadPromises = Array.from(images).map(img => {
        if (img.complete) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });

    // Tüm resimler yüklenene kadar bekle
    Promise.all(loadPromises).then(() => {

        // --- ADIM 1: RESİM ÇEKİMİ İÇİN STİLLERİ DEĞİŞTİR ---
        const originalWrapperPerspective = wrapperElement.style.perspective;

        wrapperElement.style.perspective = 'none';
        fieldElement.classList.add('is-capturing'); // CSS'ten transform/margin sıfırlaması

        // Uzaktan çekim (scale) efekti (is-capturing sınıfı içinde transform: none varsa, bu inline stil onu ezer)
        fieldElement.style.transform = 'scale(0.8)';

        // --- ADIM 2: RESMİ ÇEK ---
        htmlToImage.toPng(fieldElement, {
            quality: 0.98,
            // htmlToImage'a kaydırma pozisyonlarını sıfır olarak almasını söyle
            scrollX: 0,
            scrollY: 0,
        })
        .then((dataUrl) => {

            // --- ADIM 3: STİLLERİ VE KAYDIRMAYI GERİ YÜKLE (KRİTİK DÜZELTME) ---

            // A. Tüm geçici inline stilleri ve sınıfı temizle
            fieldElement.style.transform = ''; // scale(0.8) ve varsa diğer transformları temizler
            wrapperElement.style.perspective = originalWrapperPerspective;
            fieldElement.classList.remove('is-capturing');

            // B. KRİTİK DÜZELTME: Daha önce kaymaya neden olan bu iki manuel atamayı KALDIR
            // fieldElement.style.transform = 'rotateX(15deg) scale(0.9)'; // KALDIRILDI
            // fieldElement.style.marginTop = '-400px';                   // KALDIRILDI
            // Bu stili kaldırmak, orjinal CSS'in devreye girmesini sağlar.

            // C. KAYDIRMAYI GERİ YÜKLE
            document.body.style.overflow = '';
            window.scrollTo(0, currentScrollY);

            // İndirme işlemini başlat
            const fileName = `Ilk11_Stabil_${formation}_${selectedTeamDetails?.club_name || 'Kadro'}.png`;
            const link = document.createElement('a');
            link.download = fileName.replace(/ /g, '_');
            link.href = dataUrl;
            link.click();

        })
        .catch((err) => {
            console.error('Resim indirme hatası:', err);

            // Hata durumunda da stilleri ve kaydırmayı geri yükle
            fieldElement.style.transform = '';
            wrapperElement.style.perspective = originalWrapperPerspective;
            fieldElement.classList.remove('is-capturing');

            // C. KAYDIRMAYI GERİ YÜKLE
            document.body.style.overflow = '';
            window.scrollTo(0, currentScrollY);

            alert("Resim indirilirken bir hata oluştu. Konsolu kontrol edin.");
        });

    });
};

    const selectedTeamDetails = selectedTeam
        ? teams.find(t => t.club_id === selectedTeam.club_id)
        : null;

    const currentTeamPlayers = (players || []).filter(p =>
        p.current_club_id === selectedTeam?.club_id
    );

    // --- OYUNCU LİSTESİ FİLTRELEME VE SAYFALAMA MANTIĞI ---

    // Arama terimi ile tüm oyuncuları filtrele (Sayfalama uygulanmadan önce)
    const searchFilteredPlayers = (players || []).filter(p =>
        (p.player_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Takım oyuncularını filtrele (Takım sekmesi için)
    const teamFilteredPlayers = (currentTeamPlayers || []).filter(p =>
        (p.player_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    let playersToRender = [];
    let totalPages = 1;
    let currentListLength = 0;

    // Aktif sekmeye göre listeyi belirle
    if (activeTab === "teamPlayers") {
        // Takım sekmesi: Sadece filtrele
        playersToRender = teamFilteredPlayers;
        currentListLength = playersToRender.length;
    } else {
        // Tüm Oyuncular sekmesi: Filtrele ve Sayfala
        currentListLength = searchFilteredPlayers.length;
        totalPages = Math.ceil(currentListLength / playersPerPage);

        const startIndex = (currentPage - 1) * playersPerPage;
        const endIndex = startIndex + playersPerPage;

        // Filtrelenmiş listeyi sayfalama dilimi ile sınırla
        playersToRender = searchFilteredPlayers.slice(startIndex, endIndex);
    }

    // --- OYUNCU LİSTESİ FİLTRELEME VE SAYFALAMA MANTIĞI SONU ---


    const isSlotOccupied = (generalPos, slotIndex) => {
        return getPlayerForSlot(mySquad, generalPos, slotIndex) !== null;
    };

    // Saha sıralamasını belirle (4-2-3-1 için özel sıra)
    const renderOrder = customFormationOrder[formation] || Object.keys(fieldPositions[formation]);

    return (
        <div className="custom-squad">

            <div className="squad-builder-container">
                <h1 className="page-title">İlk 11 Oluşturucu</h1>

                <div className="main-content-wrapper">
                    {/* --- SAHA ALANI (SOLDA) --- */}
                    <div className="field-area-wrapper" ref={fieldRef}>
                            <div className="stadium-roof"></div> {/* Çatı eklendi */}

                        {/* fieldRef buraya eklendi */}
                        <div className="field-container" >
                            {selectedTeamDetails && (
                                <img
                                    src={selectedTeamDetails.logo_url ? `https://images.weserv.nl/?url=${encodeURIComponent(selectedTeamDetails.logo_url)}` : '/default_team_logo.png'}
                                    alt={selectedTeamDetails.club_name}
                                    className="selected-team-logo"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/default_team_logo.png';
                                    }}
                                />
                            )}
                            <DragDropContext onDragEnd={onDragEnd}>
                                <div className="soccer-field">
                                    {/* Ceza sahaları */}
                                    <div className="penalty-box top"></div>
                                    <div className="six-yard-box top"></div>
                                    {/* 6 pas alanı */}
                                    <div className="penalty-box bottom"></div>
                                    <div className="six-yard-box bottom"></div>
                                    {/* 6 pas alanı */}

                                    {/* renderOrder kullanılarak sıralama dinamikleştirildi */}
                                    {renderOrder.map((generalPos) => (
                                        <div className="row" key={generalPos}>
                                            {fieldPositions[formation][generalPos].map((specificPos, slotIndex) => {
                                                const player = getPlayerForSlot(mySquad, generalPos, slotIndex);
                                                const slotKey = `${generalPos}-${slotIndex}`;
                                                return (
                                                    <Droppable droppableId={slotKey} key={slotKey}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className={`player-slot ${isSlotOccupied(generalPos, slotIndex) ? "occupied" : "empty"}`}
                                                                onClick={() => handleSelectSlot(generalPos, slotIndex)}
                                                            >
                                                                {player ? (
                                                                    <Draggable draggableId={player.player_id.toString()}
                                                                               index={0} key={player.player_id}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.dragHandleProps}
                                                                                {...provided.draggableProps}
                                                                                className={`player-card ${snapshot.isDragging ? 'dragging-player' : ''}`}
                                                                            >
                                                                                <img
                                                                                    src={player.player_image_url ? `https://images.weserv.nl/?url=${encodeURIComponent(player.player_image_url)}` : '/default_player.png'}
                                                                                    alt={player.player_name}
                                                                                    onError={(e) => {
                                                                                        e.target.onerror = null; // Sonsuz döngüyü engelle
                                                                                        e.target.src = '/football-player.png';
                                                                                    }}
                                                                                />
                                                                                <div className="player-name-wrapper">
                                                                                    {/* Soyismi gösterir */}
                                                                                    <div
                                                                                        className="player-name">{getDisplayedSurname(player.player_name)}</div>
                                                                                </div>
                                                                                <button className="remove-btn"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleRemovePlayer(slotKey);
                                                                                        }}>X
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ) : (
                                                                    <div className="empty-slot-text">{specificPos}</div>
                                                                )}
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

                    {/* --- SAĞDAKİ SEÇİM SİDEBAR'I --- */}
                    <div className="selection-sidebar">
                        {/* DİZİLİŞ SEÇİMİ (HER ZAMAN GÖRÜNÜR) */}
                        <div className="formation-selection">
                            <h3>Diziliş Seçin:</h3>
                            <div className="formation-grid">
                                {Object.keys(fieldPositions).map((f) => (
                                    <button
                                        key={f}
                                        className={`formation-button ${formation === f ? 'active-formation' : ''}`}
                                        onClick={() => setFormation(f)}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* PAYLAŞ BUTONU */}
                        <button onClick={handleShare} className="share-button">
                            📸 İlk 11'i PNG Olarak İndir
                        </button>

                        {/* TAKIM SEÇİMİ ALANI (DİZİLİŞ SEÇİLİNCE GÖRÜNÜR) */}
                        <>
                            {!selectedTeam && (
                                <div className="team-selection">
                                    <h4>Bir Takım Seçin:</h4>

                                    <input
                                        type="text"
                                        placeholder="Takım Adı Ara..."
                                        value={teamSearchTerm}
                                        onChange={(e) => setTeamSearchTerm(e.target.value)}
                                        className="search-input team-search-input"
                                    />

                                    {teamSearchTerm.length === 0 && (
                                        <h4 className="list-title">Popüler (Top 10) Takımlar:</h4>
                                    )}
                                    {teamSearchTerm.length > 0 && filteredTeams.length === 0 && (
                                        <p>Aradığınız takım bulunamadı.</p>
                                    )}

                                    <div className="team-logo-list">
                                        {teamsToDisplay.map(team => (
                                            <div
                                                key={team.club_id}
                                                className="team-logo-wrapper"
                                                onClick={() => setSelectedTeam(team)}
                                            >
                                                <img
                                                    src={team.logo_url ? `https://images.weserv.nl/?url=${encodeURIComponent(team.logo_url)}` : '/default_team_logo.png'}
                                                    alt={getClubNameWithoutId(team.club_name)}
                                                    className="team-logo"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/default_team_logo.png';
                                                    }}
                                                />
                                                {/* Takım adından ID kaldırıldı */}
                                                <span
                                                    className="team-name-overlay">{getClubNameWithoutId(team.club_name)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedTeam && (
                                <div className="selected-team-info">
                                    <div className="team-header">
                                        <img
                                            src={selectedTeamDetails.logo_url ? `https://images.weserv.nl/?url=${encodeURIComponent(selectedTeamDetails.logo_url)}` : '/default_team_logo.png'}
                                            alt={selectedTeamDetails.club_name}
                                            className="sidebar-team-logo"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/default_team_logo.png';
                                            }}
                                        />
                                        <h4>Seçilen Takım: {getClubNameWithoutId(selectedTeamDetails.club_name)}</h4>
                                        <button onClick={() => setSelectedTeam(null)} className="change-team-btn">
                                            Takımı Değiştir
                                        </button>
                                    </div>
                                    <p>Oyuncu seçimi için saha slotuna tıklayın.</p>
                                </div>
                            )}
                        </>

                    </div>
                </div>


                {/* KRİTİK ÇÖZÜM: Modal görünürlüğü için is-open sınıfı eklendi */}
                <div className={`player-selection-modal ${showPlayerModal ? 'is-open' : ''}`}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Oyuncu Seç</h3>
                            <button className="close-button" onClick={() => setShowPlayerModal(false)}>Kapat</button>
                        </div>
                        <div className="tabs">
                            <button
                                className={`tab-button ${activeTab === 'teamPlayers' ? 'active' : ''}`}
                                onClick={() => setActiveTab("teamPlayers")}
                                disabled={!selectedTeam}
                            >
                                {getClubNameWithoutId(selectedTeamDetails?.club_name) || "Takım"} Kadrosu
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'allPlayers' ? 'active' : ''}`}
                                onClick={() => setActiveTab("allPlayers")}
                            >
                                Tüm Oyuncular
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Oyuncu ara veya yeni oyuncu adı gir..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <div className="player-list-container">
                            <ul className="player-list">
                                {playersToRender.length > 0 ? (
                                    playersToRender.map((p) => (
                                        <li key={p.player_id.toString()} onClick={() => handlePickAndAssign(p)}>
                                            <img
                                                src={p.player_image_url ? `https://images.weserv.nl/?url=${encodeURIComponent(p.player_image_url)}` : '/default_player.png'}
                                                alt={p.player_name}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/default_player.png';
                                                }}
                                            />
                                            {/* ID numarasını gizler, sadece adı gösterir */}
                                            <span>{getNameWithoutId(p.player_name)} - {p.position}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li>
                                        {currentListLength === 0 && searchTerm.length > 0 ?
                                            "Aradığınız kritere uygun oyuncu bulunamadı." :
                                            "Oyuncu bulunamadı."
                                        }
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Sayfalama Kontrolleri */}
                        {activeTab === "allPlayers" && totalPages > 1 && (
                            <div className="pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    &larr; Önceki
                                </button>
                                <span>Sayfa {currentPage} / {totalPages} ({currentListLength} Oyuncu)</span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Sonraki &rarr;
                                </button>
                            </div>
                        )}

                        <div className="manual-entry">
                            <button onClick={handleManualEntry}>
                                "{searchTerm}" Adında Oyuncu Ekle
                            </button>
                        </div>
                    </div>
                </div>


            </div>
            </div>
);
            }

            export default CustomSquad;
