const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const authMiddleware = require('../middleware/auth');

// Optional auth middleware — doesn't block, just attaches userId if logged in
const optionalAuth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return next();
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch { }
    next();
};

// ── POST /api/feedback ─────────────────────────────────────────
// Anyone can submit feedback (logged in or not)
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { name, email, subject, message, source } = req.body;
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
        }
        const feedback = new Feedback({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject || 'General Inquiry',
            message: message.trim(),
            source: source || 'contact_form',
            userId: req.user?.id || null
        });
        await feedback.save();
        res.status(201).json({ success: true, message: 'Feedback received! Thank you.' });
    } catch (err) {
        console.error('[POST /feedback]', err.message);
        res.status(500).json({ success: false, message: 'Failed to save feedback. Try again.' });
    }
});

// ── GET /api/feedback (admin only) ─────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Admin access only.' });
        }
        const feedbacks = await Feedback.find()
            .populate('userId', 'name email mobile')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: feedbacks });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── PATCH /api/feedback/:id/read (admin only) ──────────────────
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'Admin') return res.status(403).json({ success: false, message: 'Admin only.' });
        await Feedback.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── DELETE /api/feedback/:id (admin only) ──────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'Admin') return res.status(403).json({ success: false, message: 'Admin only.' });
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Feedback deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
