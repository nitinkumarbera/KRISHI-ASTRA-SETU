const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { createNotification } = require('../controllers/notificationController');

// ── Middleware: Admin role check ─────────────────────────────
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// ── @route   GET /api/admin/stats ────────────────────────────
// ── @desc    Dashboard counts
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [pending, verified, rejected, total] = await Promise.all([
            User.countDocuments({ kycStatus: 'Pending' }),
            User.countDocuments({ kycStatus: 'Verified' }),
            User.countDocuments({ kycStatus: 'Rejected' }),
            User.countDocuments()
        ]);
        res.json({ success: true, data: { pending, verified, rejected, total } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── @route   GET /api/admin/users ────────────────────────────
// ── @desc    Get all users (optional ?status=Pending filter)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.kycStatus = req.query.status;
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── @route   GET /api/admin/users/:id ────────────────────────
// ── @desc    Get single user full details
router.get('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── @route   PATCH /api/admin/verify-user/:id ────────────────
// ── @desc    Approve or Reject KYC
router.patch('/verify-user/:id', authMiddleware, adminOnly, async (req, res) => {
    const { status, rejectionReason } = req.body;
    if (!['Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be Verified or Rejected.' });
    }
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { kycStatus: status, rejectionReason: status === 'Rejected' ? (rejectionReason || 'No reason provided') : '' } },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // ── Trigger Notification for User ────────────────
        await createNotification({
            recipient: user._id,
            type: 'KYC',
            message: status === 'Verified'
                ? 'Your KAS account has been Verified! You can now start booking equipment.'
                : `Your KYC was rejected: ${rejectionReason || 'Please review your documents.'}`,
            link: '/profile'
        });

        res.json({ success: true, message: `User ${status === 'Verified' ? 'approved' : 'rejected'} successfully.`, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Verification update failed.' });
    }
});

module.exports = router;
