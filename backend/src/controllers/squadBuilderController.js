const Player = require('../models/Player');
const Team = require('../models/Team');

const normalizeString = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

exports.getPopularTeams = async (req, res) => {
    try {
        const teams = await Team.find({}).sort({ clubId: 1 }).limit(10);
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching popular teams.' });
    }
};

exports.getPlayersByTeam = async (req, res) => {
    try {
        const teamId = parseInt(req.params.teamId);
        if (isNaN(teamId)) {
            return res.status(400).json({ message: 'Invalid team ID.' });
        }
        const players = await Player.find({ currentClubId: teamId });
        res.status(200).json(players);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching players for team.' });
    }
};

exports.searchTeams = async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const normalizedSearchTerm = normalizeString(searchTerm);
        const query = searchTerm ? { searchName: new RegExp(normalizedSearchTerm, 'i') } : {};
        const teams = await Team.find(query).limit(20);
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ message: 'Error searching for teams.' });
    }
};

exports.searchAllPlayers = async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 18;
        const skip = (page - 1) * limit;
        const normalizedSearchTerm = normalizeString(searchTerm);

        const query = searchTerm ? { searchName: new RegExp(normalizedSearchTerm, 'i') } : {};

        const players = await Player.find(query).skip(skip).limit(limit);
        const totalPlayers = await Player.countDocuments(query);
        const totalPages = Math.ceil(totalPlayers / limit);

        res.status(200).json({
            players,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error searching for players.' });
    }
};