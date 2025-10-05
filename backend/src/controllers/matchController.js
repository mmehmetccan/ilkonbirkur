// backend/src/controllers/matchController.js

const Room = require('../models/Room');
const mongoose = require('mongoose'); // Mongoose'u ekleyin
const MatchResult = require("../models/MatchResult"); // Yeni modeli import et

// --- YARDIMCI FONKSİYONLAR ---

function getMainPosition(player) {
  if (!player) return null;
  const ap = player.assignedPosition || player.player_positions || "";
  const first = ap.split(",")[0].trim();
  return first.split(/[-\/\s]/)[0] || null;
}

function calculatePlayerPower(player) {
  const pos = getMainPosition(player);
  const overall = Number(player?.overall) || 50;
  if (pos && pos.toUpperCase().includes("GK")) {
    return Number(player?.goalkeeping_diving) || overall;
  }
  return overall;
}

function calculateTeamPower(team) {
  const squad = Array.isArray(team) ? team : [];
  const totalOverall = squad.reduce((sum, p) => sum + calculatePlayerPower(p), 0);
  const playerCount = squad.length || 1;
  const avgOverall = totalOverall / playerCount;
  return Math.pow(avgOverall, 2) * (playerCount / 11);
}

// --- ŞUT BAŞARI HESABI ---

function calculateShotSuccess(attacker, goalkeeper, isTeamAAttack, teamAPower, teamBPower) {
  const atkOVR = Number(attacker?.overall) || 50;
  const gkOVR = Number(goalkeeper?.overall) || 50;

  let baseChance = 0.25 + (atkOVR - gkOVR) / 200; // %25 taban + skill farkı
  const totalPower = teamAPower + teamBPower;
  const powerDiffNorm = (teamAPower - teamBPower) / (totalPower || 1);

  const teamEffect = isTeamAAttack
    ? (1 + powerDiffNorm * 0.6)
    : (1 - powerDiffNorm * 0.6);

  let adjusted = baseChance * teamEffect;

  // Kaleci faktörü (yüksek OVR = daha fazla kurtarış)
  const gkFactor = 1 - ((gkOVR - 60) / 50) * 0.4;
  adjusted *= gkFactor;

  return Math.max(0.05, Math.min(adjusted, 0.75));
}

function getRandomAttacker(squad) {
  if (!squad || squad.length === 0) return { short_name: "Bilinmeyen", overall: 50 };
  // Kalecileri çıkar
  const pool = squad.filter(p => {
    const pos = getMainPosition(p);
    return pos && !pos.startsWith("GK");
  });
  const attackers = pool.filter(p => ["ST", "CF", "RW", "LW", "CAM", "LM", "RM"].includes(getMainPosition(p)));
  const finalPool = attackers.length > 0 ? attackers : pool;
  const totalWeight = finalPool.reduce((s, p) => s + (Number(p.overall) || 50), 0);
  let rnd = Math.random() * totalWeight;
  for (const p of finalPool) {
    rnd -= (Number(p.overall) || 50);
    if (rnd <= 0) return p;
  }
  return finalPool[0];
}

function getGoalKeeper(squad) {
  return squad.find(p => (getMainPosition(p) || "").startsWith("GK")) || squad[0];
}

function resolveCorner(attackingSquad, defendingSquad, teamAPower, teamBPower, isTeamA) {
  const total = teamAPower + teamBPower;
  const adv = (teamAPower - teamBPower) / (total || 1);
  let chance = 0.05 + adv * 0.04;
  chance = Math.max(0.02, Math.min(chance, 0.15));
  if (Math.random() < chance) {
    const attacker = getRandomAttacker(attackingSquad);
    const gk = getGoalKeeper(defendingSquad);
    const saveChance = 0.3 + (gk.overall - 60) / 100;
    if (Math.random() > saveChance) {
      return { scored: true, scorer: attacker.short_name };
    } else {
      return { scored: false, save: true, saver: gk.short_name };
    }
  }
  return { scored: false };
}

// --- ANA MAÇ SİMÜLASYON ---

async function simulateMatch(teamA_squad, teamB_squad, playerA_data, playerB_data, io, roomId) {
  const teamAPower = calculateTeamPower(teamA_squad);
  const teamBPower = calculateTeamPower(teamB_squad);
  teamA_squad = Array.isArray(teamA_squad) ? teamA_squad : [];
  teamB_squad = Array.isArray(teamB_squad) ? teamB_squad : [];

  const teamAName = playerA_data?.name || "Team A";
  const teamBName = playerB_data?.name || "Team B";

  const avgA = (teamA_squad.reduce((s,p)=>s+(Number(p.overall)||50),0)/(teamA_squad.length||1)).toFixed(1);
  const avgB = (teamB_squad.reduce((s,p)=>s+(Number(p.overall)||50),0)/(teamB_squad.length||1)).toFixed(1);

  console.log(`\n--- MAÇ BAŞLADI ---`);
  console.log(`⚽ ${teamAName} Güç: ${teamAPower.toFixed(0)} (OVR: ${avgA})`);
  console.log(`⚽ ${teamBName} Güç: ${teamBPower.toFixed(0)} (OVR: ${avgB})`);
  console.log(`-------------------`);

  let score = { A: 0, B: 0 };
  let stats = {
    teamA: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 },
    teamB: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 }
  };
  const commentary = [];
  const yellowCards = {};
  const redCards = {};
  io?.to(roomId).emit("matchEvent", { type: "start", message: `Maç başladı! ${teamAName} vs ${teamBName}` }, score, stats, 0);

for (let minute = 1; minute <= 90; minute++) {
  const totalPower = teamAPower + teamBPower;
  const teamAInfluence = teamAPower / (totalPower || 1);

  if (Math.random() < 0.35) {
    stats.teamA.possession = Math.round(50 + (teamAInfluence - 0.5) * 60);
    stats.teamB.possession = 100 - stats.teamA.possession;
  }

  const chance = Math.random();

  // ---- ŞUT ----
  if (chance < 0.25) {
    const isA = Math.random() < teamAInfluence;
    const atkSquad = isA ? teamA_squad : teamB_squad;
    const defSquad = isA ? teamB_squad : teamA_squad;
    const atkName = isA ? teamAName : teamBName;
    const defName = isA ? teamBName : teamAName;

    const attacker = getRandomAttacker(atkSquad);
    const gk = getGoalKeeper(defSquad);


    if (isA) stats.teamA.shots++; else stats.teamB.shots++;

    const shotChance = calculateShotSuccess(attacker, gk, isA, teamAPower, teamBPower);

    // İsabetli şut (gol veya kurtarış)
    if (Math.random() < shotChance) {
      if (isA) stats.teamA.shotsOnTarget++; else stats.teamB.shotsOnTarget++;

      if (Math.random() < 0.55) { // %55 gol
        if (isA) score.A++; else score.B++;
        commentary.push(`⚽ Dakika ${minute}: GOLLL! ${atkName} - ${attacker.short_name}`);
        io?.to(roomId).emit("matchEvent",
          { type: "goal", minute, team: atkName, scorer: attacker.short_name },
          score, stats, minute);
      } else {
        // Kurtarış
        if (isA) stats.teamB.saves++; else stats.teamA.saves++;
        commentary.push(`🧤 Dakika ${minute}: Kaleci ${gk.short_name} inanılmaz bir kurtarış yaptı!`);
        io?.to(roomId).emit("matchEvent",
          { type: "save", minute, team: defName, player: gk.short_name, message: "inanılmaz bir kurtarış yaptı!" },
          score, stats, minute);

        // Kurtarış sonrası %50 korner
        if (Math.random() < 0.5) {
          if (isA) stats.teamA.corners++; else stats.teamB.corners++;
          commentary.push(`➡️ Dakika ${minute}: ${atkName} korner kazandı.`);
          io?.to(roomId).emit("matchEvent",
            { type: "corner", minute, team: atkName },
            score, stats, minute);
        }
      }
    } else {
      commentary.push(`⬆️ Dakika ${minute}: ${attacker.short_name} topu auta gönderdi.`);
      io?.to(roomId).emit("matchEvent",
        { type: "miss", minute, team: atkName, player: attacker.short_name, message: "topu auta gönderdi." },
        score, stats, minute);
    }

  // ---- FAUL ----
  } else if (chance < 0.35) {
     const isA = Math.random() < 0.5;
  const foulSquad = isA ? teamA_squad : teamB_squad;
  const foulName = isA ? teamAName : teamBName;

  const fouler = getRandomAttacker(foulSquad); // faul yapan oyuncu seç
  if (isA) stats.teamA.fouls++; else stats.teamB.fouls++;

  commentary.push(`❌ Dakika ${minute}: ${foulName} - ${fouler.short_name} faul yaptı.`);
  io?.to(roomId).emit("matchEvent",
    { type: "foul", minute, team: foulName, player: fouler.short_name },
    score, stats, minute);

  // Kart olasılığı (%30)
  if (Math.random() < 0.3) {
    yellowCards[fouler.short_name] = (yellowCards[fouler.short_name] || 0) + 1;

    if (yellowCards[fouler.short_name] === 2) {
      // Kırmızı kart
      redCards[fouler.short_name] = true;
      commentary.push(`🟥 Dakika ${minute}: ${fouler.short_name} ikinci sarıdan kırmızı kart gördü!`);
      io?.to(roomId).emit("matchEvent",
        { type: "red", minute, team: foulName, player: fouler.short_name },
        score, stats, minute);
    } else {
      // Sarı kart
      commentary.push(`🟨 Dakika ${minute}: ${fouler.short_name} sarı kart gördü.`);
      io?.to(roomId).emit("matchEvent",
        { type: "yellow", minute, team: foulName, player: fouler.short_name },
        score, stats, minute);
    }
  }

  // ---- KORNER ----
  } else if (chance < 0.45) {
    const isA = Math.random() < teamAInfluence;
    if (isA) stats.teamA.corners++; else stats.teamB.corners++;
    const atkSquad = isA ? teamA_squad : teamB_squad;
    const defSquad = isA ? teamB_squad : teamA_squad;
    const atkName = isA ? teamAName : teamBName;

    const result = resolveCorner(atkSquad, defSquad, teamAPower, teamBPower, isA);
    if (result.scored) {
      if (isA) score.A++; else score.B++;
      commentary.push(`⚽ Dakika ${minute}: ${atkName} köşe vuruşundan gol buldu! ${result.scorer}`);
      io?.to(roomId).emit("matchEvent",
        { type: "goal", minute, team: atkName, scorer: result.scorer, source: "corner" },
        score, stats, minute);
    } else if (result.save) {
      if (isA) stats.teamB.saves++; else stats.teamA.saves++;
      commentary.push(`🧤 Dakika ${minute}: Kaleci ${result.saver} köşe vuruşunu çıkardı!`);
      io?.to(roomId).emit("matchEvent",
        { type: "save", minute, team: isA ? teamBName : teamAName, player: result.saver, message: "köşe vuruşunu çıkardı!" },
        score, stats, minute);
    } else {
      commentary.push(`📍 Dakika ${minute}: ${atkName} köşe kullandı ama sonuç yok.`);
      io?.to(roomId).emit("matchEvent",
        { type: "corner", minute, team: atkName },
        score, stats, minute);
    }
  }

  await new Promise(r => setTimeout(r, 150));
}

  io?.to(roomId).emit("matchEvent", { type: "end", message: `Maç bitti: ${score.A}-${score.B}` }, score, stats, 90);
  return { score: `${score.A}-${score.B}`, commentary, goalsA: score.A, goalsB: score.B, stats };
}

exports.getFinishedMatches = async (req, res) => {
    try {
        const finishedMatches = await MatchResult.find({})
            .sort({ playedAt: -1 }) // En yeniyi başa al
            .limit(20) // Sadece son 20 maçı getir
            // roomId popülasyonu (Oda silinse bile deneriz, Room verisi için)
            .populate('roomId', 'roomName')
            // Kullanıcı popülasyonu (Kullanıcı silinse bile || 'Bilinmeyen A' ile devam ederiz)
            .populate('teamA', 'username')
            .populate('teamB', 'username');

        const formattedMatches = finishedMatches
            .map(match => {
                // Eğer Room kaydı veritabanından silinmişse, match.roomId null/tanımsız olabilir.
                // Bu durumda maçı atlamak yerine, oda adı için bir fallback (yedek) değer kullanırız.

                // match.roomId null ise maçı atlamak isterseniz:
                /*
                if (!match.roomId) {
                    console.warn(`Veritabanından silinmiş bir odaya ait maç kaydı atlanıyor: ${match._id}`);
                    return null;
                }
                */

                // Tüm matchleri göstermek için:
                return {
                    matchId: match._id,
                    // match.roomId?.roomName silinen odalar için null dönecektir.
                    roomName: match.roomId?.roomName || 'Turnuva (Oda Silindi)',
                    score: match.result?.score,
                    goalsA: match.result?.goalsA,
                    goalsB: match.result?.goalsB,
                    date: match.playedAt,
                    stats: match.result?.stats,
                    commentary: match.result?.commentary || [],
                    // Popülasyon başarısız olsa bile (kullanıcı silindiyse) fallback değeri kullan
                    teamA: match.teamA?.username || 'Bilinmeyen A',
                    teamB: match.teamB?.username || 'Bilinmeyen B',
                };
            })
            // Eğer yukarıda match.roomId için atlama filtresini kullanırsanız, burayı aktif tutun.
            .filter(match => match !== null);

        res.status(200).json(formattedMatches);

    } catch (error) {
        console.error("Maç geçmişi getirilirken hata:", error);
        res.status(500).json({ message: "Maç geçmişi getirilemedi", error: error.message });
    }
};




exports.startTournament = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  try {
    const room = await Room.findById(roomId).populate("players.user", "name");
    if (!room) return res.status(404).json({ message: "Oda bulunamadı." });
    if (room.creator.toString() !== userId.toString()) return res.status(403).json({ message: "Sadece oda sahibi başlatabilir." });
    if (room.status !== "draft_finished") return res.status(400).json({ message: "Tüm oyuncular kadrolarını oluşturmadı." });

    const matchesToPlay = [];
    for (let i = 0; i < room.players.length; i++) {
      for (let j = i + 1; j < room.players.length; j++) {
        matchesToPlay.push({ teamA: room.players[i].user._id, teamB: room.players[j].user._id, played: false, result: null });
      }
    }

    room.status = "in_progress";
    room.matchesToPlay = matchesToPlay;
    room.matches = [];
    await room.save();
    req.app.get("io")?.to(roomId).emit("updateRoom", room);
    res.json({ message: "Turnuva başladı", room });
  } catch (err) {
    res.status(500).json({ message: "Turnuva başlatılırken hata", error: err.message });
  }
};

exports.startNextMatch = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;



  try {
    const room = await Room.findById(roomId).populate("players.user", "name");
    if (!room || room.status !== "in_progress") return res.status(400).json({ message: "Turnuva başlamadı." });
    if (room.creator.toString() !== userId.toString()) return res.status(403).json({ message: "Sadece oda sahibi başlatabilir." });

    const nextMatch = room.matchesToPlay.find(m => !m.played);
if (!nextMatch) {
  room.status = "finished";
  await room.save();
  req.app.get("io")?.to(roomId).emit("updateRoom", room);
  return res.json({ message: "Turnuva bitti.", room });
}

// Oyuncu verilerini bul
const playerA_data = room.players.find(p => p.user._id.toString() === nextMatch.teamA.toString());
const playerB_data = room.players.find(p => p.user._id.toString() === nextMatch.teamB.toString());
console.log("playerA_data:", playerA_data);
console.log("playerB_data:", playerB_data);
console.log("playerA_data.team:", playerA_data.team);
console.log("playerB_data.team:", playerB_data.team);
// Eğer eşleşme yoksa hata fırlatma yerine mesaj ver
if (!playerA_data || !playerB_data) {
  console.error("Eşleşme bulunamadı:", nextMatch);
  return res.status(400).json({ message: "Maç için oyuncu verisi eksik." });
}
    const result = await simulateMatch(playerA_data.team?.squad || [], playerB_data.team?.squad || [], playerA_data, playerB_data, req.app.get("io"), roomId);

    nextMatch.played = true;
    nextMatch.result = result;

    const pa = playerA_data, pb = playerB_data;
    if (result.goalsA > result.goalsB) { pa.wins++; pa.points += 3; pb.losses++; }
    else if (result.goalsB > result.goalsA) { pb.wins++; pb.points += 3; pa.losses++; }
    else { pa.draws++; pb.draws++; pa.points++; pb.points++; }

    pa.goalsFor += result.goalsA; pa.goalsAgainst += result.goalsB;
    pb.goalsFor += result.goalsB; pb.goalsAgainst += result.goalsA;

    if (nextMatch && nextMatch.result) {
        const { teamA, teamB } = nextMatch;

        // 1. MatchResult koleksiyonuna kaydet
        const newMatch = new MatchResult({
            roomId: room._id,
            teamA: teamA,
            teamB: teamB,
            result: result, // result objesinin tamamı (score, goalsA, commentary vb.)
        });
        await newMatch.save();

        // 2. Son 20 maç kuralını uygula (Limit kontrolü)
        const matchCount = await MatchResult.countDocuments({ roomId: room._id });

        if (matchCount > 20) {
            // En eski maçı bul (playedAt: 1, yani Artan sıralama)
            const oldestMatch = await MatchResult.findOne({ roomId: room._id })
                .sort({ playedAt: 1 })
                .exec();

            if (oldestMatch) {
                await MatchResult.deleteOne({ _id: oldestMatch._id });
                console.log(`20 maç limiti aşıldığı için en eski maç silindi: ${oldestMatch._id}`);
            }
        }
    }

// Maç sonucu kaydedildikten sonra, oynanmamış maç kalıp kalmadığını kontrol et.
    const hasNextMatch = room.matchesToPlay.some(m => !m.played);

    if (!hasNextMatch) {
      room.status = "finished";
      console.log(`Tüm maçlar tamamlandı. Oda durumu 'finished' olarak güncellendi.`);

 // **********************************************************
      // YENİ EKLENECEK MANTIK BURADA BAŞLIYOR:
      // **********************************************************

      const io = req.app.get("io");
      const ROOM_DELETION_DELAY_MS = 5 * 60 * 1000; // 5 dakika

      // 1. Kullanıcılara anlık bildirim gönder
      io?.to(roomId).emit("roomEvent", {
          type: "tournament_finished",
          message: "Turnuva tamamlanmıştır! Oda 5 dakika içinde otomatik olarak silinecektir."
      });

      // 2. Odayı silmek için zamanlayıcı kur
      setTimeout(async () => {
        try {
          // Odanın gerçekten hala "finished" durumda olup olmadığını kontrol etmek faydalı olabilir
          const roomToDelete = await Room.findById(roomId);
          if (roomToDelete && roomToDelete.status === 'finished') {
             await Room.deleteOne({ _id: roomId });
             console.log(`Oda ${roomId} (Turnuva bitti) otomatik olarak silindi.`);
             // Odanın silindiğini kullanıcılara bildir (eğer hala bağlılarsa)
             io?.to(roomId).emit("roomEvent", {
                 type: "room_deleted",
                 message: "Oda otomatik olarak silinmiştir."
             });
          }
        } catch (error) {
          console.error(`Oda silinirken hata oluştu: ${roomId}`, error.message);
        }
      }, ROOM_DELETION_DELAY_MS);

      // **********************************************************
      // YENİ EKLENECEK MANTIK BURADA BİTİYOR:
      // **********************************************************
    }

    await room.save();
    req.app.get("io")?.to(roomId).emit("updateRoom", room);
    res.json({ message: `Maç sonucu: ${result.score}`, result, room });
  } catch (err) {
    res.status(500).json({ message: "Maç simülasyonu hatası", error: err.message });
  }
};


exports.getRecentMatches = async (req, res) => {
    const { roomId } = req.params;
    try {
        const recentMatches = await MatchResult.find({ roomId: roomId })
            .sort({ playedAt: -1 }) // En yeni başta
            .limit(20) // Sadece 20 tanesini getir
            .populate('teamA', 'username') // ✅ username alanını çeker
            .populate('teamB', 'username'); // ✅ username alanını çeker

        // MatchResult verilerini Frontend'in beklediği formata dönüştür
        const formattedMatches = recentMatches.map(match => ({
            matchId: match._id,
            roomId: match.roomId,
            roomName: match.roomName || 'Bilinmeyen Oda', // Room verisinden gelmediği için burada sabit bir değer kullanmak gerekebilir
            score: match.result?.score,
            goalsA: match.result?.goalsA,
            goalsB: match.result?.goalsB,
            date: match.playedAt,
            stats: match.result?.stats,
            commentary: match.result?.commentary || [],
            // Populated User objesinden username'i alıyoruz
            teamA: match.teamA?.username || 'Bilinmeyen A',
            teamB: match.teamB?.username || 'Bilinmeyen B',
        }));
        res.status(200).json(formattedMatches);
    } catch (error) {
        res.status(500).json({ message: "Son maçlar yüklenemedi." });
    }
};