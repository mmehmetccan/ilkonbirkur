// backend/src/routes/playerRoutes.js - 'require' formatına çevrildi

const express = require('express');
const fs = require('fs');
const path = require('path');
// 'import' yerine 'require' kullanıldı ve sondaki '.js' kaldırıldı
const { getInitialData } = require('../controllers/initialDataController');

const router = express.Router();

// Bu kod aynı kalabilir
const playersFilePath = path.resolve(process.cwd(), 'src/data/players.json');
const playersData = JSON.parse(fs.readFileSync(playersFilePath, 'utf8'));

// Auth gerektirmeyen, anasayfa oluşturucu için veri endpoint'i
router.get('/initial', getInitialData);

router.get('/all-players', (req, res) => {
  try {
    // DÜZELTME: playersData'nın bir dizi (array) olup olmadığını kontrol et
    if (Array.isArray(playersData)) {
      // Verinin tamamını gönder, çünkü o zaten oyuncu dizisi
      res.json(playersData);
    } else {
      // Eğer format yine de beklenmedikse, hata gönder
      res.status(404).json({ message: "Oyuncu verisi dizi formatında değil." });
    }
  } catch (error) {
    console.error("Oyuncu verisi okunurken hata:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// 'export default' yerine 'module.exports' kullanıldı
module.exports = router;