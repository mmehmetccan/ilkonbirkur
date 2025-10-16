require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Player = require('../src/models/Player.js');
const Team = require('../src/models/Team.js');

const normalizeString = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const playersDataPath = path.resolve(__dirname, '../src/data/playersss.json');
const teamsDataPath = path.resolve(__dirname, '../src/data/team_details.json');
const playersData = JSON.parse(fs.readFileSync(playersDataPath, 'utf8'));
const teamsData = JSON.parse(fs.readFileSync(teamsDataPath, 'utf8'));

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB veri aktarımı için bağlandı...');
        await Player.deleteMany({});
        await Team.deleteMany({});
        console.log('Mevcut koleksiyonlar temizlendi.');

        const playersToInsert = playersData
            .filter(p => p && p.player_id != null && p.player_name != null)
            .map(p => ({
                playerId: p.player_id,
                playerName: p.player_name.replace(/\s\(\d+\)$/, '').trim(),
                searchName: normalizeString(p.player_name),
                imageUrl: p.player_image_url,
                position: p.position || 'Unknown',
                currentClubId: p.current_club_id
            }));

        const teamsToInsert = teamsData
            .filter(t => t && t.club_id != null && t.club_name != null)
            .map(t => ({
                clubId: t.club_id,
                clubName: t.club_name.replace(/\s\(\d+\)$/, '').trim(),
                searchName: normalizeString(t.club_name),
                logoUrl: t.logo_url
            }));

        await Player.insertMany(playersToInsert);
        console.log(`✅ Başarıyla ${playersToInsert.length} oyuncu aktarıldı.`);
        await Team.insertMany(teamsToInsert);
        console.log(`✅ Başarıyla ${teamsToInsert.length} takım aktarıldı.`);

    } catch (error) {
        console.error('❌ Veri aktarımı sırasında hata oluştu:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB bağlantısı kapatıldı.');
    }
};

importData();