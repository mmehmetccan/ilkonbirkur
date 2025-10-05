const express = require('express');
const { sendContactEmail } = require('../controllers/contactController.js');

const router = express.Router();

router.post('/', sendContactEmail);

module.exports = router;
