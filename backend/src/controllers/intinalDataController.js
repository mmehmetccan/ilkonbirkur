const fs = require('fs');
const path = require('path');

const playersPath = path.resolve("./src/data/playersss.json");
const teamsPath = path.resolve("./src/data/team_details.json");

let players = [];
let teams = [];

try {
    players = JSON.parse(fs.readFileSync(playersPath, "utf8"));
    teams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
    console.log("Oyuncu ve Takım verileri belleğe yüklendi.");
} catch (error) {
    console.error("Veri dosyaları yüklenirken hata oluştu:", error.message);
}

const getInitialData = async (req, res) => {
    try {
        if (players.length === 0 || teams.length === 0) {
            return res.status(503).json({ message: "Veriler sunucu tarafından yüklenemedi." });
        }
-        res.status(200).json({
            players: players,
            teams: teams
        });
    } catch (error) {
        console.error("İlk veri çekme hatası:", error);
        res.status(500).json({ message: "İlk veriler çekilirken sunucu hatası oluştu." });
    }
};

module.exports = { getInitialData };