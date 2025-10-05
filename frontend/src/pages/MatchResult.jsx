// frontend/src/pages/MatchResult.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import '../styles/MatchResult.css';
import { BarChart2, MessageSquare, Clock, Users } from 'lucide-react'; // Lucide ikonları eklendi

const socket = io("http://localhost:3000");

// --- EKLENEN ALT BİLEŞEN: İstatistik Çubuğu (StatBar) ---
const StatBar = ({ label, valA, valB, teamA, teamB, isPercentage = false }) => {
    // Dashboard.jsx dosyasından kopyalanmıştır.
    const numericValA = isPercentage ? parseFloat(valA) : parseInt(valA);
    const numericValB = isPercentage ? parseFloat(valB) : parseInt(valB);
    const total = isPercentage ? 100 : numericValA + numericValB;
    // Toplam 0 ise %50 göster
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
                {/* HATA DÜZELTİLDİ: 'numericA' yerine 'numericValA' kullanıldı */}
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


const MatchResult = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [currentMatchResult, setCurrentMatchResult] = useState(null);
  const [error, setError] = useState(null);
  const [liveCommentary, setLiveCommentary] = useState([]);
  const [liveScore, setLiveScore] = useState({ A: 0, B: 0 });
  const [liveStats, setLiveStats] = useState({
    teamA: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 },
    teamB: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 }
  });
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isMatchSimulating, setIsMatchSimulating] = useState(false);
  const [isHalfTime, setIsHalfTime] = useState(false);
  const [loading, setLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    socket.on("connect", () => console.log("Socket bağlandı:", socket.id));
    socket.on("disconnect", () => console.log("Socket bağlantısı kesildi"));

    socket.emit("joinRoom", roomId);
    socket.on("updateRoom", (updatedRoom) => setRoom(updatedRoom));

    socket.on("matchEvent", (event, score, stats, minute) => {
      setLiveScore(score);
      setLiveStats(stats);
      setCurrentMinute(minute);

      if (event.type === "start") {
        setIsMatchSimulating(true);
        setIsHalfTime(false);
        setLoading(false);
        setLiveCommentary([event.message]);
      } else if (event.type === "half_time") {
        setIsHalfTime(true);
        setLiveCommentary(prev => [event.message, ...prev]);
      } else if (event.type === "end") {
        setIsMatchSimulating(false);
        setIsHalfTime(false);
        setLiveCommentary(prev => [event.message, ...prev]);

        const fetchRoomOnEnd = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/api/rooms/${roomId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setRoom(data);
          } catch (err) {
            console.error("Oda tekrar çekilemedi:", err);
          }
        };
        fetchRoomOnEnd();
      } else if (event.type !== "minute_update") {
        let msg = "";
        if (event.type === "goal") {
          msg = `⚽ GOL! ${event.team} - ${event.scorer}`;
        } else if (event.type === "save") {
          msg = `🧤 ${event.team} kalecisi ${event.player} harika kurtardı!`;
        } else if (event.type === "miss") {
          msg = `❌ ${event.team}: ${event.player} ${event.message}`;
        } else if (event.type === "corner") {
          msg = `🟦 ${event.team} korner kazandı.`;
        } else if (event.type === "foul") {
          msg = `🎺${event.team}: ${event.player} faul yaptı.`;
        } else if (event.type === "yellow") {
          msg = `🟨 ${event.team}: ${event.player} sarı kart gördü.`;
        } else if (event.type === "red") {
          msg = `🟥 ${event.team}: ${event.player} kırmızı kart gördü!`;
        }
        setLiveCommentary(prev => [`${event.minute}' - ${msg}`, ...prev]);
      }
    });

    return () => {
      socket.off("updateRoom");
      socket.off("matchEvent");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [roomId]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setRoom(data);
          const lastPlayed = data.matchesToPlay.filter(m => m.played && m.result).pop();
          if (lastPlayed) setCurrentMatchResult(lastPlayed.result);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchRoom();
  }, [roomId]);

  const handleStartNextMatch = async () => {
    setLoading(true);
    setError(null);
    setLiveCommentary([]);
    setLiveScore({ A: 0, B: 0 });
    setLiveStats({
      teamA: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 },
      teamB: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 }
    });
    setCurrentMinute(0);
    setIsHalfTime(false);
    setIsMatchSimulating(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/match/${roomId}/start-next-match`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (error) return <div className="match-container error-message">Hata: {error}</div>;
  if (!room) return <div className="match-container loading-message">Yükleniyor...</div>;

  const upcomingMatches = room.matchesToPlay || [];
  const nextMatch = upcomingMatches.find(m => !m.played);
  const nextMatchTeams = nextMatch ? {
    teamA_id: nextMatch.teamA,
    teamB_id: nextMatch.teamB,
    teamA_name: room.players.find(p => p.user._id === nextMatch.teamA)?.name,
    teamB_name: room.players.find(p => p.user._id === nextMatch.teamB)?.name,
  } : null;

  const isCreator = userInfo && room.creator && userInfo._id.toString() === room.creator.toString();
  const hasPlayedMatches = room.matchesToPlay.some(m => m.played);
  const playedMatches = room.matchesToPlay.filter(m => m.played).reverse();

  return (
    <div className="match-page-container">
      <div className="header"><h2>⚡ Turnuva Maçları</h2></div>

      <div className="match-section">
        <h3>📅 Fikstür</h3>
        <ul className="fixture-list">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((m, idx) => {
              const teamA = room.players.find(p => p.user._id === m.teamA)?.name || "Takım A";
              const teamB = room.players.find(p => p.user._id === m.teamB)?.name || "Takım B";
              const isNext = nextMatch && nextMatch._id.toString() === m._id.toString();
              return (
                <li key={idx} className={`fixture-item ${m.played ? 'played' : 'upcoming'}`}>
                  <span className="fixture-team teamA">{teamA}</span>
                  <span className="vs">vs</span>
                  <span className="fixture-team teamB">{teamB}</span>
                  {m.played && m.result && <span className="match-result"> {m.result.score}</span>}
                  {isNext && !m.played && isCreator && !isMatchSimulating && (
                    <button onClick={handleStartNextMatch} disabled={loading} className="start-match-button">
                      {loading ? '⏳ Maç Başlatılıyor...' : '▶ Maçı Başlat!'}
                    </button>
                  )}
                </li>
              );
            })
          ) : <p>Henüz fikstür oluşturulmadı.</p>}
        </ul>
      </div>

      {isMatchSimulating && (
        <div className="live-match-container">
          <h3>🎥 Canlı Maç: {nextMatchTeams?.teamA_name} vs {nextMatchTeams?.teamB_name}</h3>
          <div className="live-match-header">
            <div className="team-info team-a">
              <span className="team-name">{nextMatchTeams?.teamA_name || "Takım A"}</span>
              <span className="score">{liveScore.A}</span>
            </div>
            <div className="match-status">
              <span className="minute">{currentMinute}'</span>
              <span className="half-status">{isHalfTime ? 'Devre Arası' : 'Oynanıyor'}</span>
            </div>
            <div className="team-info team-b">
              <span className="score">{liveScore.B}</span>
              <span className="team-name">{nextMatchTeams?.teamB_name || "Takım B"}</span>
            </div>
          </div>

          {/* ESKİ İSTATİSTİK DİV'LERİ STATBAR İLE DEĞİŞTİRİLDİ */}
          <div className="live-stats">
            <StatBar label="Topa Sahip Olma" valA={liveStats.teamA.possession} valB={liveStats.teamB.possession} teamA={nextMatchTeams?.teamA_name} teamB={nextMatchTeams?.teamB_name} isPercentage={true}/>
            <StatBar label="Şut (Toplam)" valA={liveStats.teamA.shots} valB={liveStats.teamB.shots} teamA={nextMatchTeams?.teamA_name} teamB={nextMatchTeams?.teamB_name}/>
            <StatBar label="Şut (İsabet)" valA={liveStats.teamA.shotsOnTarget} valB={liveStats.teamB.shotsOnTarget} teamA={nextMatchTeams?.teamA_name} teamB={nextMatchTeams?.teamB_name}/>
            <StatBar label="Korner" valA={liveStats.teamA.corners} valB={liveStats.teamB.corners} teamA={nextMatchTeams?.teamA_name} teamB={nextMatchTeams?.teamB_name}/>
            <StatBar label="Kurtarış" valA={liveStats.teamA.saves} valB={liveStats.teamB.saves} teamA={nextMatchTeams?.teamA_name} teamB={nextMatchTeams?.teamB_name}/>
            <StatBar label="Faul" valA={liveStats.teamA.fouls} valB={liveStats.teamB.fouls} teamA={nextMatchTeams?.teamA_name} teamB={nextMatchTeams?.teamB_name}/>
          </div>

          <div className="live-commentary-box">
            <h3>📝 Canlı Anlatım</h3>
            <ul className="commentary-list">
              {liveCommentary.map((c, i) => (
                <li key={i} className="commentary-item">{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!isMatchSimulating && hasPlayedMatches && (
        <div className="last-match-results">
          <h3>📊 Oynanan Maçlar</h3>
          <ul className="played-matches-list">
            {playedMatches.map((m, idx) => {
              const teamA = room.players.find(p => p.user._id === m.teamA)?.name || "Takım A";
              const teamB = room.players.find(p => p.user._id === m.teamB)?.name || "Takım B";
              return (
                <li key={idx} className="played-match-item">
                  <strong>{teamA} vs {teamB}</strong>: {m.result.score}
                  <div className="match-stats-summary">
                    <h4>İstatistikler</h4>

                    {/* ESKİ TABLO STATBAR İLE DEĞİŞTİRİLDİ */}
                    <div className="match-stats-bars">
                      <StatBar label="Topa Sahip Olma" valA={m.result.stats.teamA.possession}
                               valB={m.result.stats.teamB.possession} teamA={teamA} teamB={teamB} isPercentage={true}/>
                      <StatBar label="Şut (Toplam)" valA={m.result.stats.teamA.shots} valB={m.result.stats.teamB.shots}
                               teamA={teamA} teamB={teamB}/>
                      <StatBar label="Şut (İsabet)" valA={m.result.stats.teamA.shotsOnTarget}
                               valB={m.result.stats.teamB.shotsOnTarget} teamA={teamA} teamB={teamB}/>
                      <StatBar label="Korner" valA={m.result.stats.teamA.corners} valB={m.result.stats.teamB.corners}
                               teamA={teamA} teamB={teamB}/>
                      <StatBar label="Kurtarış" valA={m.result.stats.teamA.saves} valB={m.result.stats.teamB.saves}
                               teamA={teamA} teamB={teamB}/>
                      <StatBar label="Faul" valA={m.result.stats.teamA.fouls} valB={m.result.stats.teamB.fouls}
                               teamA={teamA} teamB={teamB}/>
                    </div>

                    <h4>Anlatım Özeti</h4>
                    <ul className="commentary-summary-list">
                      {m.result.commentary.map((text, index) => {
                        // Yorumdaki ikona göre dinamik sınıf ekleme (Örnek Mantık)
                        let icon = '';
                        let className = '';

                        if (text.includes('⚽')) {
                          className = 'has-goal';
                          icon = <span className="goal-icon">⚽</span>;
                        } else if (text.includes('🟥')) {
                          className = 'has-red-card';
                          icon = <span className="red-card-icon">🟥</span>;
                        } else if (text.includes('⬆️')) {
                          icon = <span>⬆️</span>;
                        } else if (text.includes('🧤')) {
                          icon = <span>🧤</span>;
                        }

                        // İkonu metinden temizleyip başa al
                        const cleanedText = text.replace(/⚽|🟥|⬆️|🧤/, '').trim();

                        return (
                            <li key={index} className={className}>
                              {icon} {cleanedText}
                            </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MatchResult;