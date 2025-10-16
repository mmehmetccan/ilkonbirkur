// backend/src/services/simulationService.js


function getMainPosition(player) {
    if (!player) return "MID";
    const pos = player.assignedPosition || player.player_positions || "";
    return pos.split(",")[0].trim();
}

const getEffectiveOverall = (player) => {
    const originalOverall = Number(player.overall) || 65;
    if (!player.assignedPosition || !player.player_positions) {
        return originalOverall;
    }

    const positionMap = {
        GK: ['GK'],
        DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'LCB', 'RCB'],
        MID: ['CM', 'CAM', 'CDM', 'LM', 'RM'],
        FWD: ['ST', 'CF', 'LW', 'RW']
    };

    const assignedGeneralPos = player.assignedPosition.split('-')[0].replace('ACM', 'MID').replace('DCM', 'MID');
    const naturalPositions = player.player_positions.split(',').map(p => p.trim());

    const requiredPositions = positionMap[assignedGeneralPos] || [];

    const isInPosition = naturalPositions.some(pos => requiredPositions.includes(pos));

    if (isInPosition) {
        return originalOverall;
    } else {
        if (assignedGeneralPos === 'GK' || naturalPositions.includes('GK')) {
            console.log(`[Güç Düşüşü] ${player.short_name} kalede/kaleden uzakta oynuyor. Güç: ${originalOverall} -> ${originalOverall * 0.4}`);
            return originalOverall * 0.40;
        }
        console.log(`[Güç Düşüşü] ${player.short_name} mevkisi dışında oynuyor. Güç: ${originalOverall} -> ${originalOverall * 0.88}`);
        return originalOverall * 0.88;
    }
};

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
    const playerAdvantage = ((finishing + composure + shotPower) / 3 - (gkReflexes + gkPositioning) / 2) / 300;
    let baseChance = 0.25 + playerAdvantage;
    const powerAdvantage = (teamPower - opponentPower) / 150;
    let finalChance = baseChance + powerAdvantage;
    return Math.max(0.05, Math.min(finalChance, 0.75));
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

    let score = { A: 0, B: 0 };
    let stats = {
        teamA: { possession: Math.round((powerA / (powerA + powerB)) * 100), shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 },
        teamB: { possession: Math.round((powerB / (powerA + powerB)) * 100), shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, saves: 0 }
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

        const attackChance = (powerA / (powerA + powerB)) + 0.1;
        const attackingTeam = (Math.random() < attackChance) ? 'A' : 'B';
        const defendingTeam = (attackingTeam === 'A') ? 'B' : 'A';

        const attackingSquad = (attackingTeam === 'A') ? teamAPlayers : teamBPlayers;
        const defendingSquad = (defendingTeam === 'A') ? teamAPlayers : teamBPlayers;
        const attackingPower = (attackingTeam === 'A') ? powerA : powerB;
        const defendingPower = (defendingTeam === 'A') ? powerA : powerB;

        const actionProbability = 0.20 + (attackingPower - defendingPower) / 200;
        if (Math.random() > actionProbability) {
            io.to(socketId).emit("matchEvent", { type: "minute_update" }, score, stats, minute);
            return;
        }

        const eventType = Math.random();

        if (eventType < 0.70) {
            const attacker = getRandomPlayer(attackingSquad, "FWD");
            const defender = getRandomPlayer(defendingSquad, "DEF");
            const goalkeeper = getGoalKeeper(defendingSquad);
            const teamName = attackingTeam === 'A' ? "Senin Takımın" : "Rakip Takım";
            const opponentTeamName = defendingTeam === 'A' ? "Senin Takımın" : "Rakip Takım";
            const shotOnTargetChance = 0.4 + ((attacker.attacking_finishing || 65) - (defender.defending || 65)) / 250;

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

        } else if (eventType < 0.85) {
            if (defendingTeam === 'A') stats.teamA.fouls++; else stats.teamB.fouls++;
             io.to(socketId).emit("matchEvent", { type: "minute_update" }, score, stats, minute);
        } else {
             if (attackingTeam === 'A') stats.teamA.corners++; else stats.teamB.corners++;
             io.to(socketId).emit("matchEvent", { type: "minute_update" }, score, stats, minute);
        }

    }, intervalTime);
};

module.exports = { runLiveSimulation };