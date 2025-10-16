const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const {
    createSharedSquad,
    getSharedSquads,
    getSharedSquadById,
    likeSquad,
    dislikeSquad,
    addComment
} = require('../controllers/sharedSquadController');

router.post('/', optionalProtect, createSharedSquad);

router.get('/', getSharedSquads);
router.get('/:id', getSharedSquadById);

router.post('/:id/like', protect, likeSquad);
router.post('/:id/dislike', protect, dislikeSquad);
router.post('/:id/comment', protect, addComment);

module.exports = router;