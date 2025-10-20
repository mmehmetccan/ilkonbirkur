// backend/src/controllers/singlePlayerController.js

const { runLiveSimulation } = require('../services/simulationService');
const playersData = require('../data/players.json');
const AppStat = require('../models/appStatModel');
const getGeneralPosition = (player) => {
    if (!player || !player.player_positions) return 'MID';
    const pos = player.player_positions;
    if (pos.includes('GK')) return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].some(p => pos.includes(p))) return 'DEF';
    if (['CM', 'CAM', 'CDM', ].some(p => pos.includes(p))) return 'MID';
    if (['ST', 'CF', 'LW', 'RW','LM', 'RM'].some(p => pos.includes(p))) return 'FWD';

    return 'MID';
};


exports.getAllPlayers = (req, res) => {
    try {
        const { page = 1, limit = 24, search = '', position = 'All' } = req.query;
        const normalizeText = (text = '') => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        let players = playersData;

        if (position && position !== 'All') {
            players = players.filter(p => getGeneralPosition(p) === position);
        }

        if (search) {
            const normSearch = normalizeText(search.toLowerCase().trim());
            players = players.filter(p => {
                const longName = normalizeText(p.long_name || '');
                const shortName = normalizeText(p.short_name || '');
                return longName.includes(normSearch) || shortName.includes(normSearch);
            });
        }

        players.sort((a, b) => (b.overall || 0) - (a.overall || 0));


        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedPlayers = players.slice(startIndex, endIndex);

        res.status(200).json({
            players: paginatedPlayers,
            currentPage: Number(page),
            totalPages: Math.ceil(players.length / limit)
        });
    } catch (error) {
        console.error("Oyuncular getirilirken hata:", error);
        res.status(500).json({ message: "Oyuncular getirilirken bir sunucu hatası oluştu." });
    }
};

exports.getOpponentTeams = (req, res) => {
    try {
        const { search = '' } = req.query;
        const lowercasedSearch = search.toLowerCase().trim();
        const teamsMap = new Map();

        playersData.forEach(player => {
            if (player.club_team_id && player.club_name) {
                if (!teamsMap.has(player.club_team_id)) {
                    teamsMap.set(player.club_team_id, {
                        clubId: player.club_team_id,
                        clubName: player.club_name,
                        leagueName: player.league_name || 'Diğer',
                        playerCount: 0
                    });
                }
                teamsMap.get(player.club_team_id).playerCount++;
            }
        });

        let validTeams = Array.from(teamsMap.values()).filter(team => team.playerCount >= 11);
        if (lowercasedSearch) {
            validTeams = validTeams.filter(team => team.clubName.toLowerCase().includes(lowercasedSearch));
        }
        validTeams.sort((a, b) => a.clubName.localeCompare(b.clubName));
        res.status(200).json(validTeams);
    } catch (error) {
        console.error("Takım listesi oluşturulurken hata:", error);
        res.status(500).json({ message: "Takımlar getirilirken bir sunucu hatası oluştu." });
    }
};

exports.simulateSinglePlayerMatch = async (req, res) => {
    try {
        const io = req.app.get("io");
        const { mySquad, opponentTeamId, socketId } = req.body;

        if (!mySquad || mySquad.length < 11 || !opponentTeamId || !socketId) {
            return res.status(400).json({ message: "Geçersiz istek. Kadro, rakip veya socket ID eksik." });
        }

        const opponentRoster = playersData.filter(p => p.club_team_id === opponentTeamId);
        if (opponentRoster.length < 11) {
            return res.status(400).json({ message: "Rakip takımın 11'den az oyuncusu var." });
        }

        opponentRoster.sort((a, b) => b.overall - a.overall);
        const opponentSquad = opponentRoster.slice(0, 11);

        try {
            await AppStat.findOneAndUpdate(
                { name: 'global_stats' },
                { $inc: { totalSimulations: 1 } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log("Simülasyon sayacı MongoDB'de güncellendi.");
        } catch (statError) {
            console.error("MongoDB istatistik (simülasyon) güncelleme hatası:", statError);
        }

        runLiveSimulation(mySquad, opponentSquad, io, socketId);
        res.status(200).json({ message: "Simülasyon başarıyla başlatıldı." });

    } catch (error) {
        console.error("Maç simülasyonu başlatılırken hata:", error);
        res.status(500).json({ message: "Maç simülasyonu başlatılırken bir sunucu hatası oluştu." });
    }
};