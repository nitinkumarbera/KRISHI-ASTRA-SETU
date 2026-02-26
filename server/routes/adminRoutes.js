const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');
const { createNotification } = require('../controllers/notificationController');

// ── Middleware: Admin role check ─────────────────────────────
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// ── GET /api/admin/stats ─────────────────────────────────────
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

// ── GET /api/admin/users ─────────────────────────────────────
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.kycStatus = req.query.status;
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── GET /api/admin/users/:id ─────────────────────────────────
router.get('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── PATCH /api/admin/verify-user/:id ────────────────────────
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

// ════════════════════════════════════════════════════════════
// EQUIPMENT MANAGEMENT
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/equipment ─────────────────────────────────
router.get('/equipment', authMiddleware, adminOnly, async (req, res) => {
    try {
        const equipment = await Equipment.find()
            .populate('owner', 'name email mobile')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: equipment });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── DELETE /api/admin/equipment/:id ──────────────────────────
router.delete('/equipment/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const equip = await Equipment.findByIdAndDelete(req.params.id);
        if (!equip) return res.status(404).json({ success: false, message: 'Equipment not found.' });
        res.json({ success: true, message: 'Equipment listing removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ════════════════════════════════════════════════════════════
// BOOKINGS MANAGEMENT
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/bookings ──────────────────────────────────
router.get('/bookings', authMiddleware, adminOnly, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('renter', 'name email mobile')
            .populate('owner', 'name email')
            .populate('equipment', 'name category priceDay')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ════════════════════════════════════════════════════════════
// REVIEWS MANAGEMENT
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/reviews ───────────────────────────────────
router.get('/reviews', authMiddleware, adminOnly, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('renter', 'name email')
            .populate('equipment', 'name category')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── DELETE /api/admin/reviews/:id ────────────────────────────
router.delete('/reviews/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
        res.json({ success: true, message: 'Review removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════

// ── POST /api/admin/announce ─────────────────────────────────
router.post('/announce', authMiddleware, adminOnly, async (req, res) => {
    const { message } = req.body;
    if (!message?.trim()) {
        return res.status(400).json({ success: false, message: 'Announcement message is required.' });
    }
    try {
        const users = await User.find({ role: { $ne: 'Admin' } }).select('_id');
        await Promise.all(users.map(u =>
            createNotification({ recipient: u._id, type: 'General', message: `📢 Admin: ${message}`, link: '/' })
        ));
        res.json({ success: true, message: `Announcement sent to ${users.length} users.` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to send announcement.' });
    }
});

// ════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/analytics ─────────────────────────────────
router.get('/analytics', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [
            totalBookings, completedBookings, activeEquipment, totalUsers,
            revenueAgg, categoryAgg, districtAgg, monthlyAgg
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Completed' }),
            Equipment.countDocuments(),
            User.countDocuments({ role: 'Member' }),
            Booking.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Equipment.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            User.aggregate([
                { $match: { role: 'Member', 'address.district': { $exists: true, $ne: '' } } },
                { $group: { _id: '$address.district', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            Booking.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 },
                        revenue: { $sum: '$totalPrice' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalBookings, completedBookings, activeEquipment, totalUsers,
                totalRevenue: revenueAgg[0]?.total || 0,
                categoryBreakdown: categoryAgg,
                districtBreakdown: districtAgg,
                monthlyTrend: monthlyAgg
            }
        });
    } catch (err) {
        console.error('[Analytics]', err.message);
        res.status(500).json({ success: false, message: 'Analytics error.' });
    }
});

module.exports = router;
