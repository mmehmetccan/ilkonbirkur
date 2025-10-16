const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    playerId: { type: Number, required: true, unique: true, index: true },
    playerName: { type: String, required: true },
    searchName: { type: String, required: true, index: true },
    imageUrl: { type: String },
    position: { type: String, required: true },
    currentClubId: { type: Number, index: true }
});

module.exports = mongoose.model('Player', playerSchema);