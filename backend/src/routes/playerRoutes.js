const express = require('express');
// Yeni controller'ı import edin
const { getInitialData } = require('../controllers/initialDataController'); 

const router = express.Router();

// Auth gerektirmeyen, anasayfa oluşturucu için veri endpoint'i
router.get('/initial', getInitialData); 

module.exports = router;