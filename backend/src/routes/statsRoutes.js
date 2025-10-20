const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// CustomSquad'dan gelen isteği bu route karşılayacak
router.post('/increment-assignment', statsController.incrementPlayerAssignment);

module.exports = router;