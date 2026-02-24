const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getMyNotifications, markAsRead, markAllRead } = require('../controllers/notificationController');

// @route   GET /api/notifications
router.get('/', authMiddleware, getMyNotifications);

// @route   PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, markAsRead);

// @route   POST /api/notifications/read-all
router.post('/read-all', authMiddleware, markAllRead);

module.exports = router;
