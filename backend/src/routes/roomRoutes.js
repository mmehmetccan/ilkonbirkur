const express = require('express');
const {
    createRoom,
    getRooms,
    joinRoom,
    getRoomById,
    leaveRoom,
    inviteFriend,
    setReady,
    kickPlayer
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const {pickPlayer,setFormation} = require("../controllers/pickPlayerController");

const router = express.Router();

router.post('/create', protect, createRoom);
router.get('/', protect, getRooms);
router.post('/join', protect, joinRoom);
router.post('/leave', protect, leaveRoom);
router.post("/kick-player", protect, kickPlayer);

router.get('/:roomId', protect, getRoomById);

router.post("/ready", protect, setReady);
router.post('/:roomId/set-formation', protect, setFormation);

router.post("/:roomId/pick-player", protect, pickPlayer);

router.post("/invite", protect, inviteFriend);

module.exports = router;