const fs = require('fs');
const path = require('path');
// Node.js'teki CommonJS yapısına uyalım

// Dosya yollarının backend'in kök dizinine göre doğru olduğundan emin olun
const playersPath = path.resolve("./src/data/playersss.json");
const teamsPath = path.resolve("./src/data/team_details.json");

let players = [];
let teams = [];

try {
    // Sunucu BAŞLADIĞINDA veriyi belleğe yükle
    players = JSON.parse(fs.readFileSync(playersPath, "utf8"));
    teams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
    console.log("Oyuncu ve Takım verileri belleğe yüklendi.");
} catch (error) {
    console.error("Veri dosyaları yüklenirken hata oluştu:", error.message);
}

// Oyuncu ve takım verilerini tek bir API çağrısıyla döndüren fonksiyon
const getInitialData = async (req, res) => {
    try {
        if (players.length === 0 || teams.length === 0) {
            return res.status(503).json({ message: "Veriler sunucu tarafından yüklenemedi." });
        }
        // Belleğe yüklenmiş oyuncu ve takım verilerini döndürün
        res.status(200).json({
            players: players,
            teams: teams
        });
    } catch (error) {
        console.error("İlk veri çekme hatası:", error);
        res.status(500).json({ message: "İlk veriler çekilirken sunucu hatası oluştu." });
    }
};

module.exports = { getInitialData };