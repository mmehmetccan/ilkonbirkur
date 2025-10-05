const mongoose = require("mongoose");

const matchResultSchema = new mongoose.Schema({
    // Bu maçın ait olduğu oda bilgisi
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    // Maçın sonucu ve detayları (matchesToPlay[i].result alanındaki tüm veriler)
    result: {
        score: { type: String, required: true },
        commentary: [{ type: String }],
        goalsA: { type: Number, default: 0 },
        goalsB: { type: Number, default: 0 },
        stats: { type: Object }, // Detaylı istatistikler
    },
    // Maçın oynandığı iki takım
    teamA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Veya oyuncunun adını/ID'sini tutabilirsiniz
        required: true,
    },
    teamB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Maçın ne zaman kaydedildiği (Sıralama için kritik)
    playedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("MatchResult", matchResultSchema);