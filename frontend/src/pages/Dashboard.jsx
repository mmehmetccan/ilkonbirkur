// C:/Users/PC/Desktop/Footbalsim/frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate,useParams  } from 'react-router-dom';
import axios from 'axios';
import { BarChart2, MessageSquare, Clock, Users } from 'lucide-react';
import '../styles/Dashboard.css';
const BASE_API_URL = import.meta.env.VITE_API_URL;

const API_URL = `${BASE_API_URL}/api/match`;
// --- Alt Bileşen: İstatistik Çubuğu ---
const StatBar = ({ label, valA, valB, teamA, teamB, isPercentage = false }) => {
    const numericValA = isPercentage ? parseFloat(valA) : parseInt(valA);
    const numericValB = isPercentage ? parseFloat(valB) : parseInt(valB);
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
                <span className={numericValA > numericValB ? 'highlight-a' : ''}>
                    {valA}{isPercentage ? '%' : ''}
                </span>
                <span className={numericValB > numericValA ? 'highlight-b' : ''}>
                    {valB}{isPercentage ? '%' : ''}
                </span>
            </div>

            <div className="stat-bar-progress">
                <div style={{ width: `${percentA}%` }} className="stat-a"></div>
                <div style={{ width: `${100 - percentA}%` }} className="stat-b"></div>
            </div>
        </div>
    );
};

// --- Alt Bileşen: Maç Detay Modalı ---
const MatchDetailModal = ({ match, onClose }) => {
    if (!match) return null;
    const isTeamAWinner = match.goalsA > match.goalsB;
    const isDraw = match.goalsA === match.goalsB;

    const getCommentaryIcon = (line) => {
        if (line.includes('GOLLL!')) return '⚽';
        if (line.includes('Kaleci') || line.includes('kurtarış')) return '🧤';
        if (line.includes('köşe kullandı')) return '📍';
        if (line.includes('korner kazandı')) return '➡️';
        if (line.includes('faul')) return '❌';
        if (line.includes('sarı kart')) return '🟨';
        if (line.includes('kırmızı kart')) return '🟥';
        return '•';
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">

                <div className="modal-header">
                    <h2>Maç Detayları: {match.teamA} vs {match.teamB}</h2>
                    <button onClick={onClose} className="modal-close">✕</button>
                </div>

                <div className="modal-score">
                    <div>
                        <h3 className={isTeamAWinner ? 'highlight-a' : isDraw ? '' : ''}>
                            {match.teamA}
                        </h3>
                        <p><Users size={14}/> Oda: {match.roomName}</p>
                    </div>

                    <div className="score-box">{match.goalsA} - {match.goalsB}</div>

                    <div>
                        <h3 className={!isTeamAWinner && !isDraw ? 'highlight-b' : isDraw ? '' : ''}>
                            {match.teamB}
                        </h3>
                        <p><Clock size={14}/> {new Date(match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>

                <div className="modal-stats">
                    <h3><BarChart2 size={18}/> Maç İstatistikleri</h3>
                    <StatBar label="Topa Sahip Olma" valA={match.stats.teamA.possession} valB={match.stats.teamB.possession} teamA={match.teamA} teamB={match.teamB} isPercentage={true}/>
                    <StatBar label="Şut (Toplam)" valA={match.stats.teamA.shots} valB={match.stats.teamB.shots} teamA={match.teamA} teamB={match.teamB}/>
                    <StatBar label="Şut (İsabet)" valA={match.stats.teamA.shotsOnTarget} valB={match.stats.teamB.shotsOnTarget} teamA={match.teamA} teamB={match.teamB}/>
                    <StatBar label="Korner" valA={match.stats.teamA.corners} valB={match.stats.teamB.corners} teamA={match.teamA} teamB={match.teamB}/>
                    <StatBar label="Kurtarış" valA={match.stats.teamA.saves} valB={match.stats.teamB.saves} teamA={match.teamA} teamB={match.teamB}/>
                    <StatBar label="Faul" valA={match.stats.teamA.fouls} valB={match.stats.teamB.fouls} teamA={match.teamA} teamB={match.teamB}/>
                </div>

                <div className="modal-commentary">
                    <h3><MessageSquare size={18}/> Anlatım (Commentary)</h3>
                    <div className="commentary custom-scrollbar">
                        {match.commentary.slice().reverse().map((c, index) => (
                            <div key={index} className="commentary-item">
                                <span className="commentary-icon">{getCommentaryIcon(c)}</span>
                                <p>{c}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-close">Kapat</button>
                </div>
            </div>
        </div>
    );
};

// --- Ana Bileşen ---
const DashboardMatches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const navigate = useNavigate();
    const { roomId } = useParams(); // URL'den oda ID'sini alıyoruz

    // ✅ GÜNCELLENMİŞ VE TEK BİR useEffect BLOĞU
    useEffect(() => {
        const fetchMatches = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
            setError("Bu içeriği görmek için lütfen giriş yapın.");
            setLoading(false);
            return;
            }

            try {
                let response;

                // Eğer URL'de bir roomId varsa, MatchResult'tan yeni endpoint'i çağır
                if (roomId) {
                    // YENİ VE DOĞRU ENDPOINT: /api/match/:roomId/recent
                    response = await axios.get(`${API_URL}/${roomId}/recent`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    // Eğer roomId yoksa (genel dashboard), genel endpoint'i kullanmaya devam et
                    response = await axios.get(`${API_URL}/finished-matches`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }

                // Backend (matchController.js) veriyi zaten doğru formatta (teamA, teamB, goalsA/B, stats vb.) gönderiyor.
                setMatches(response.data);
                setError(null);

            } catch (err) {
                console.error("Maçları yükleme hatası:", err);
                setError("Maç geçmişi yüklenirken hata oluştu. Sunucuya bakınız.");
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [roomId, navigate]); // roomId veya navigate değiştiğinde tekrar çalışır


    if (loading) return <div className="loading">Maçlar yükleniyor...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="dashboard">
            <h1>Turnuva Geçmişi: Son 20 Maç</h1>

            {matches.length === 0 ? (
                <div className="empty">Henüz oynanmış bir maç bulunmamaktadır. Bir turnuva başlatın!</div>
            ) : (
                <div className="matches-grid">
                    {matches.map((match) => {
                        const isTeamAWinner = match.goalsA > match.goalsB;
                        const isDraw = match.goalsA === match.goalsB;
                        const winner = isDraw ? 'Berabere' : isTeamAWinner ? match.teamA : match.teamB;

                        return (
                            <div key={match.matchId} className="match-card">
                                <div className={`match-card-header ${isDraw ? 'draw' : isTeamAWinner ? 'team-a' : 'team-b'}`}>
                                    <div><Clock size={12}/> {new Date(match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                    <div><Users size={12}/> {match.roomName}</div>
                                </div>

                                <div className="match-card-body">
                                    <div className={isTeamAWinner ? 'highlight-a' : ''}>{match.teamA}</div>
                                    <div className="score-box">{match.score}</div>
                                    <div className={!isTeamAWinner && !isDraw ? 'highlight-b' : ''}>{match.teamB}</div>
                                </div>

                                <div className="match-card-footer">
                                    {isDraw ? (
                                        <span className="winner-text yellow">Maç Berabere Bitti</span>
                                    ) : (
                                        <span className="winner-text green">Kazanan: {winner}</span>
                                    )}
                                    <button onClick={() => setSelectedMatch(match)} className="btn-details">
                                        <BarChart2 size={16}/> Detayları Gör
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedMatch && (
                <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
            )}
        </div>
    );
};

export default DashboardMatches;
