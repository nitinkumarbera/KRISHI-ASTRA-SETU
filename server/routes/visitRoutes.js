const express = require('express');
const router = express.Router();
const { ping, getStats } = require('../controllers/visitController');

// Public routes — no auth required
router.post('/ping', ping);
router.get('/stats', getStats);

module.exports = router;
