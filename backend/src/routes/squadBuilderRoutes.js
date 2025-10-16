const express = require('express');
const router = express.Router();
const {
    getPopularTeams,
    searchTeams,
    getPlayersByTeam,
    searchAllPlayers
} = require('../controllers/squadBuilderController');

router.get('/teams/popular', getPopularTeams);
router.get('/teams/search', searchTeams);
router.get('/players/by-team/:teamId', getPlayersByTeam);
router.get('/players/search', searchAllPlayers);

module.exports = router;