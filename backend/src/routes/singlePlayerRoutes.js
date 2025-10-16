const express = require('express');
const router = express.Router();
const { simulateSinglePlayerMatch, getOpponentTeams, getAllPlayers } = require('../controllers/singlePlayerController');

router.get('/teams', getOpponentTeams);

router.get('/players', getAllPlayers);

router.post('/simulate', simulateSinglePlayerMatch);

module.exports = router;