// backend/src/importPlayers.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('./models/Player');
const playersData = require('./data/playerss.json');

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB\'ye bağlandı...');

        await Player.deleteMany(); // Önceki verileri temizle
        console.log('Önceki oyuncu verileri silindi.');

        await Player.insertMany(playersData); // JSON dosyasından verileri ekle
        console.log('Oyuncu verileri başarıyla veritabanına aktarıldı!');

        // Sonraki işlemde oluşabilecek hata için oyuncu verilerinin tamamlandığını bildir
        const count = await Player.countDocuments();
        console.log(`${count} oyuncu veritabanına kaydedildi.`);

        mongoose.connection.close();
        console.log('MongoDB bağlantısı kapatıldı.');
    } catch (error) {
        console.error('Veri aktarma hatası:', error);
        process.exit(1);
    }
};

importData();