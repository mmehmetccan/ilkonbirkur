const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { startNextMatch, startTournament,getFinishedMatches,getRecentMatches } = require('../controllers/matchController');

router.post('/:roomId/start-tournament', protect, startTournament);
router.post('/:roomId/start-next-match', protect, startNextMatch);
router.get('/finished-matches', protect, getFinishedMatches);
router.get('/:roomId/recent', protect, getRecentMatches);

module.exports = router;
