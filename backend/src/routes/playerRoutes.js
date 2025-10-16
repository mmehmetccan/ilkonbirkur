// backend/src/routes/playerRoutes.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const { getInitialData } = require('../controllers/intinalDataController');

const router = express.Router();

const playersFilePath = path.resolve(process.cwd(), 'src/data/players.json');
const playersData = JSON.parse(fs.readFileSync(playersFilePath, 'utf8'));

router.get('/initial', getInitialData);

router.get('/all-players', (req, res) => {
  try {
    if (Array.isArray(playersData)) {
      res.json(playersData);
    } else {
      res.status(404).json({ message: "Oyuncu verisi dizi formatında değil." });
    }
  } catch (error) {
    console.error("Oyuncu verisi okunurken hata:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

module.exports = router;