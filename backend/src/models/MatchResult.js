const mongoose = require("mongoose");

const matchResultSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    result: {
        score: { type: String, required: true },
        commentary: [{ type: String }],
        goalsA: { type: Number, default: 0 },
        goalsB: { type: Number, default: 0 },
        stats: { type: Object }, // Detaylı istatistikler
    },
    teamA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    teamB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    playedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("MatchResult", matchResultSchema);