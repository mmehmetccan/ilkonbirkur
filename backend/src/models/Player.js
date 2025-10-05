// backend/src/models/Player.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    power: {
        type: Number,
        required: true
    },
    mainPosition: {
        type: String,
        required: true
    },
    secondaryPositions: {
        type: [String], // Bir oyuncunun birden fazla yan pozisyonu olabilir
        default: []
    }
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;