// backend/src/services/simulationService.js

function getMainPosition(player) {
    if (!player) return "MID";
    const pos = player.assignedPosition || player.player_positions || "";
    return pos.split(",")[0].trim();
}

// =================================================================
// DEĞİŞİKLİK 1: positionMap'i global kapsama taşıdık (iki fonksiyon da kullanacak)
// =================================================================
const positionMap = {
    GK: ['GK'],
    DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'LCB', 'RCB'],
    MID: ['CM', 'CAM', 'CDM', 'LM', 'RM'],
    FWD: ['ST', 'CF', 'LW', 'RW']
};

// =================================================================
// DEĞİŞİKLİK 2: Oyuncunun ana mevkisini (FWD, MID, DEF) bulan yeni yardımcı fonksiyon
// =================================================================
function getNaturalGeneralPosition(player) {
    if (!player || !player.player_positions) return 'MID';
    const naturalPositions = player.player_positions.split(',').map(p => p.trim());

    if (naturalPositions.some(p => positionMap.GK.includes(p))) return 'GK';
    // Defans ve Forveti önce kontrol et, Orta Saha en geneli
    if (naturalPositions.some(p => positionMap.DEF.includes(p))) return 'DEF';
    if (naturalPositions.some(p => positionMap.FWD.includes(p))) return 'FWD';
    if (naturalPositions.some(p => positionMap.MID.includes(p))) return 'MID';

    return 'MID'; // Fallback
}


// =================================================================
// DEĞİŞİKLİK 3: getEffectiveOverall, daha detaylı ceza sistemiyle güncellendi
// =================================================================
const getEffectiveOverall = (player) => {
    const originalOverall = Number(player.overall) || 65;
    if (!player.assignedPosition || !player.player_positions) {
        return originalOverall;
    }

    // "ACM" (Hücumcu Orta Saha) veya "DCM" (Defansif Orta Saha) gibi
    // özel mevkileri ana "MID" kategorisine eşle
    const assignedGeneralPos = player.assignedPosition.split('-')[0].replace('ACM', 'MID').replace('DCM', 'MID');
    const naturalPositions = player.player_positions.split(',').map(p => p.trim());

    // Oyuncunun atanacağı yerin gerektirdiği pozisyonlar
    // Örn: assignedGeneralPos = "FWD" ise requiredPositions = ['ST', 'CF', 'LW', 'RW']
    const requiredPositions = positionMap[assignedGeneralPos] || [];

    // Oyuncunun doğal pozisyonlarından en az biri, atandığı yerin
    // gerektirdiği pozisyonlardan biriyle eşleşiyor mu?
    const isInPosition = naturalPositions.some(pos => requiredPositions.includes(pos));

    if (isInPosition) {
        // MEVKİSİNDE OYNUYOR: Güç düşüşü yok.
        return originalOverall;
    } else {
        // MEVKİSİ DIŞINDA OYNUYOR:
        const naturalGeneralPos = getNaturalGeneralPosition(player);
        let penaltyMultiplier = 0.75; // Varsayılan (daha sert) ceza

        // 1. Kaleci Hatası (En büyük ceza)
        // Kalede olmayan birini kaleye koymak VEYA kaleciyi başka yere koymak.
        if (assignedGeneralPos === 'GK' || naturalGeneralPos === 'GK') {
            penaltyMultiplier = 0.40; // Gücünün %40'ı kalır
        }
        // 2. Doğal mevkisi Forvet (FWD) ise
        else if (naturalGeneralPos === 'FWD') {
            if (assignedGeneralPos === 'MID') penaltyMultiplier = 0.85; // FWD -> MID (Hafif ceza)
            if (assignedGeneralPos === 'DEF') penaltyMultiplier = 0.65; // FWD -> DEF (Ağır ceza)
        }
        // 3. Doğal mevkisi Orta Saha (MID) ise
        else if (naturalGeneralPos === 'MID') {
            if (assignedGeneralPos === 'FWD') penaltyMultiplier = 0.80; // MID -> FWD (Orta ceza)
            if (assignedGeneralPos === 'DEF') penaltyMultiplier = 0.80; // MID -> DEF (Orta ceza)
        }
        // 4. Doğal mevkisi Defans (DEF) ise
        else if (naturalGeneralPos === 'DEF') {
            if (assignedGeneralPos === 'MID') penaltyMultiplier = 0.70; // DEF -> MID (Ağır ceza)
            if (assignedGeneralPos === 'FWD') penaltyMultiplier = 0.60; // DEF -> FWD (Çok ağır ceza)
        }

        const newOverall = (originalOverall * penaltyMultiplier).toFixed(0);
        console.log(`[Güç Düşüşü] ${player.short_name} (${naturalGeneralPos}) mevkisi (${assignedGeneralPos}) dışında oynuyor. Güç: ${originalOverall} -> ${newOverall}`);
        return originalOverall * penaltyMultiplier;
    }
};

// =================================================================
// Kalan fonksiyonlar DEĞİŞMEDİ
// =================================================================

function calculateTeamPower(squad) {
    if (!squad || squad.length === 0) return 70;
    const totalEffectiveOverall = squad.reduce((sum, p) => sum + getEffectiveOverall(p), 0);
    return totalEffectiveOverall / squad.length;
}


function calculateGoalProbability(attacker, goalkeeper, teamPower, opponentPower) {
    const finishing = Number(attacker?.attacking_finishing) || 65;
    const composure = Number(attacker?.mentality_composure) || 65;
    const shotPower = Number(attacker?.skill_moves) || 65;
    const gkReflexes = Number(goalkeeper?.goalkeeping_reflexes) || 65;
    const gkPositioning = Number(goalkeeper?.goalkeeping_positioning) || 65;

    const playerAdvantage = ((finishing + composure + shotPower) / 3 - (gkReflexes + gkPositioning) / 2) / 200;
    let baseChance = 0.30 + playerAdvantage;

    const powerAdvantage = (teamPower - opponentPower) / 100;
    let finalChance = baseChance + powerAdvantage;

    return Math.max(0.05, Math.min(finalChance, 0.80));
}


function getRandomPlayer(squad, position = "ANY") {
    if (!squad || squad.length === 0) return { short_name: "Bilinmeyen", overall: 60 };
    let filteredSquad = squad;
    if (position !== "ANY") {
        filteredSquad = squad.filter(p => getMainPosition(p).includes(position));
    }
    if (filteredSquad.length === 0) {
        filteredSquad = squad;
    }
    return filteredSquad[Math.floor(Math.random() * filteredSquad.length)];
}

function getGoalKeeper(squad) {
    return squad.find(p => getMainPosition(p).startsWith("GK")) || { short_name: "Kaleci", overall: 65, goalkeeping_reflexes: 65, goalkeeping_positioning: 65 };
}

const runLiveSimulation = (teamAPlayers, teamBPlayers, io, socketId) => {
    const powerA = calculateTeamPower(teamAPlayers);
    const powerB = calculateTeamPower(teamBPlayers);

    console.log(`--- CANLI Maç Simülasyonu Başladı (Socket: ${socketId}) ---`);
    console.log(`Senin Takımın: Etkili Güç: ${powerA.toFixed(2)}`);
    console.log(`Rakip Takım:   Etkili Güç: ${powerB.toFixed(2)}`);
    console.log(`-----------------------------------------------------`);

    const powerA_raised = Math.pow(powerA, 3);
    const powerB_raised = Math.pow(powerB, 3);
    const totalPowerRaised = powerA_raised + powerB_raised;

    let score = { A: 0, B: 0 };
    let stats = {
        teamA: { possession: Math.round((powerA_raised / totalPowerRaised) * 100), shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 },
        teamB: { possession: Math.round((powerB_raised / totalPowerRaised) * 100), shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 }
    };

    io.to(socketId).emit("matchEvent", { type: "start", message: "Maç Başladı!" }, score, stats, 0);

    let minute = 0;
    const matchDurationSeconds = 30;
    const intervalTime = (matchDurationSeconds * 1000) / 90;

    const matchInterval = setInterval(() => {
        minute++;
        if (minute > 90) {
            clearInterval(matchInterval);
            io.to(socketId).emit("matchEvent", { type: "end", message: "Maç sona erdi!" }, score, stats, 90);
            return;
        }

        const attackChance = powerA_raised / totalPowerRaised;
        const attackingTeam = (Math.random() < attackChance) ? 'A' : 'B';
        const defendingTeam = (attackingTeam === 'A') ? 'B' : 'A';

        const attackingSquad = (attackingTeam === 'A') ? teamAPlayers : teamBPlayers;
        const defendingSquad = (defendingTeam === 'A') ? teamAPlayers : teamBPlayers;
        const attackingPower = (attackingTeam === 'A') ? powerA : powerB;
        const defendingPower = (defendingTeam === 'A') ? powerA : powerB;

        const actionProbability = 0.25 + (attackingPower - defendingPower) / 100;
        if (Math.random() > actionProbability) {
            io.to(socketId).emit("matchEvent", { type: "minute_update" }, score, stats, minute);
            return;
        }

        const eventType = Math.random();

        if (eventType < 0.70) { // Şut olayı
            const attacker = getRandomPlayer(attackingSquad, "FWD");
            const defender = getRandomPlayer(defendingSquad, "DEF");
            const goalkeeper = getGoalKeeper(defendingSquad);
            const teamName = attackingTeam === 'A' ? "Senin Takımın" : "Rakip Takım";
            const opponentTeamName = defendingTeam === 'A' ? "Senin Takımın" : "Rakip Takım";

            const shotOnTargetChance = 0.45 + ((attacker.attacking_finishing || 65) - (defender.defending || 65)) / 150;

            if (attackingTeam === 'A') stats.teamA.shots++; else stats.teamB.shots++;

            if (Math.random() < shotOnTargetChance) {
                if (attackingTeam === 'A') stats.teamA.shotsOnTarget++; else stats.teamB.shotsOnTarget++;

                const goalChance = calculateGoalProbability(attacker, goalkeeper, attackingPower, defendingPower);

                if (Math.random() < goalChance) {
                    if (attackingTeam === 'A') score.A++; else score.B++;
                    io.to(socketId).emit("matchEvent", { type: "goal", team: teamName, scorer: attacker.short_name }, score, stats, minute);
                } else {
                    if (defendingTeam === 'A') stats.teamA.saves++; else stats.teamB.saves++;
                    io.to(socketId).emit("matchEvent", { type: "save", team: opponentTeamName, player: goalkeeper.short_name }, score, stats, minute);
                }
            } else {
                io.to(socketId).emit("matchEvent", { type: "miss", team: teamName, player: attacker.short_name }, score, stats, minute);
            }

        } else if (eventType < 0.85) { // Faul olayı
            if (defendingTeam === 'A') stats.teamA.fouls++; else stats.teamB.fouls++;
             io.to(socketId).emit("matchEvent", { type: "minute_update" }, score, stats, minute);
        } else { // Korner olayı
             if (attackingTeam === 'A') stats.teamA.corners++; else stats.teamB.corners++;
             io.to(socketId).emit("matchEvent", { type: "minute_update" }, score, stats, minute);
        }

    }, intervalTime);
};

module.exports = { runLiveSimulation };