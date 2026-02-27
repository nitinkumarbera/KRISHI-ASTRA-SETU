const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');
const { createNotification } = require('../controllers/notificationController');

// â”€â”€ Middleware: Admin role check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// â”€â”€ GET /api/admin/stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ GET /api/admin/users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ GET /api/admin/users/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ PATCH /api/admin/verify-user/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EQUIPMENT MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ GET /api/admin/equipment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ DELETE /api/admin/equipment/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete('/equipment/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const equip = await Equipment.findByIdAndDelete(req.params.id);
        if (!equip) return res.status(404).json({ success: false, message: 'Equipment not found.' });
        res.json({ success: true, message: 'Equipment listing removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BOOKINGS MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ GET /api/admin/bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REVIEWS MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ GET /api/admin/reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ DELETE /api/admin/reviews/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete('/reviews/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
        res.json({ success: true, message: 'Review removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ANNOUNCEMENTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ POST /api/admin/announce â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/announce', authMiddleware, adminOnly, async (req, res) => {
    const { message } = req.body;
    if (!message?.trim()) {
        return res.status(400).json({ success: false, message: 'Announcement message is required.' });
    }
    try {
        const users = await User.find({ role: { $ne: 'Admin' } }).select('_id');
        await Promise.all(users.map(u =>
            createNotification({ recipient: u._id, type: 'General', message: `ðŸ“¢ Admin: ${message}`, link: '/' })
        ));
        res.json({ success: true, message: `Announcement sent to ${users.length} users.` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to send announcement.' });
    }
});


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ANALYTICS  â€”  comprehensive endpoint
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ GET /api/admin/analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/analytics', authMiddleware, adminOnly, async (req, res) => {
    try {
        const now = new Date();

        // Helper: build date bucket pipeline
        const since = (days) => new Date(now - days * 86400000);

        const [
            totalBookings,
            completedBookings,
            cancelledBookings,
            activeEquipment,
            totalUsers,
            pendingKyc,
            // Revenue aggregations
            allTimeRevenue,
            // Time-series: last 365 days grouped by day (for weekly/monthly etc)
            dailyAgg,
            // Category revenue
            categoryRevenue,
            // District breakdown
            districtAgg,
            // Top lenders by revenue earned (subtotal)
            topLenders,
            // Top renters by spend
            topRenters,
            // Platform fee (commission) collected
            commissionAgg,
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Completed' }),
            Booking.countDocuments({ status: { $in: ['Cancelled', 'Cancelled_By_Renter', 'Cancelled_By_Lender'] } }),
            Equipment.countDocuments(),
            User.countDocuments({ role: 'Member' }),
            User.countDocuments({ kycStatus: 'Pending' }),

            // All-time completed revenue (totalAmount field used by escrow; fall back to totalPrice)
            Booking.aggregate([
                { $match: { status: { $in: ['Completed', 'Rental_Started', 'Admin_Approved'] } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } }, subtotal: { $sum: '$subtotal' }, fee: { $sum: '$platformFee' }, gst: { $sum: '$gst' } } }
            ]),

            // Daily revenue + bookings for last 365 days
            Booking.aggregate([
                { $match: { createdAt: { $gte: since(365) } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        bookings: { $sum: 1 },
                        revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
                        lenderEarnings: { $sum: '$subtotal' },
                        platformFee: { $sum: '$platformFee' },
                        gst: { $sum: '$gst' },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $in: ['$status', ['Cancelled', 'Cancelled_By_Renter', 'Cancelled_By_Lender']] }, 1, 0] } }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]),

            // Category revenue
            Booking.aggregate([
                { $lookup: { from: 'equipment', localField: 'equipment', foreignField: '_id', as: 'eq' } },
                { $unwind: { path: '$eq', preserveNullAndEmptyArrays: false } },
                { $group: { _id: '$eq.category', revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } }, bookings: { $sum: 1 } } },
                { $sort: { revenue: -1 } },
                { $limit: 8 }
            ]),

            User.aggregate([
                { $match: { role: 'Member', 'address.district': { $exists: true, $ne: '' } } },
                { $group: { _id: '$address.district', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 6 }
            ]),

            // Top lenders (owners) by subtotal earned
            Booking.aggregate([
                { $match: { status: { $in: ['Completed', 'Rental_Started', 'Admin_Approved'] } } },
                { $group: { _id: '$owner', subtotal: { $sum: '$subtotal' }, count: { $sum: 1 } } },
                { $sort: { subtotal: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
                { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
                { $project: { name: { $concat: [{ $ifNull: ['$u.name.first', ''] }, ' ', { $ifNull: ['$u.name.last', ''] }] }, subtotal: 1, count: 1 } }
            ]),

            // Top renters by total spend
            Booking.aggregate([
                { $group: { _id: '$renter', spend: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } }, count: { $sum: 1 } } },
                { $sort: { spend: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
                { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
                { $project: { name: { $concat: [{ $ifNull: ['$u.name.first', ''] }, ' ', { $ifNull: ['$u.name.last', ''] }] }, spend: 1, count: 1 } }
            ]),

            // Platform commission (Admin fee + GST) from completed bookings
            Booking.aggregate([
                { $match: { status: { $in: ['Completed', 'Rental_Started', 'Admin_Approved'] } } },
                { $group: { _id: null, fee: { $sum: '$platformFee' }, gst: { $sum: '$gst' } } }
            ])
        ]);

        // Build daily data array with ISO date strings for easy frontend grouping
        const dailyData = dailyAgg.map(d => ({
            date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
            bookings: d.bookings,
            revenue: d.revenue || 0,
            lenderEarnings: d.lenderEarnings || 0,
            platformFee: d.platformFee || 0,
            gst: d.gst || 0,
            completed: d.completed,
            cancelled: d.cancelled
        }));

        res.json({
            success: true,
            data: {
                // Totals
                totalBookings,
                completedBookings,
                cancelledBookings,
                activeEquipment,
                totalUsers,
                pendingKyc,
                cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
                // Revenue summary
                totalRevenue: allTimeRevenue[0]?.total || 0,
                totalSubtotal: allTimeRevenue[0]?.subtotal || 0,
                totalFee: allTimeRevenue[0]?.fee || 0,
                totalGst: allTimeRevenue[0]?.gst || 0,
                platformRevenue: (commissionAgg[0]?.fee || 0) + (commissionAgg[0]?.gst || 0),
                // Time-series (raw daily, frontend groups into weekly/monthly/etc)
                dailyData,
                // Breakdowns
                categoryRevenue,
                districtBreakdown: districtAgg,
                topLenders,
                topRenters
            }
        });
    } catch (err) {
        console.error('[Analytics]', err.message);
        res.status(500).json({ success: false, message: 'Analytics error.' });
    }
});



// ── DELETE /api/admin/users/:id ──────────────────────────────
// Cascade-delete: Equipment → Bookings → Reviews → Notifications → User
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const targetId = req.params.id;

        // Prevent admin deleting themselves
        if (String(targetId) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: 'Admins cannot delete their own account.' });
        }

        const user = await User.findById(targetId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // Cascade delete all user data
        await Equipment.deleteMany({ owner: targetId });
        await Booking.deleteMany({ $or: [{ renter: targetId }, { owner: targetId }] });
        await Review.deleteMany({ reviewer: targetId });

        const Notification = require('../models/Notification');
        await Notification.deleteMany({ recipient: targetId });

        await User.findByIdAndDelete(targetId);

        console.log(`[Admin Delete] User ${user.email} (${targetId}) deleted by admin ${req.user.id}`);
        res.json({ success: true, message: `User "${user.name?.first || user.email}" and all their data have been permanently deleted.` });
    } catch (err) {
        console.error('[DELETE /admin/users/:id]', err.message);
        res.status(500).json({ success: false, message: 'Server error during user deletion.' });
    }
});

module.exports = router;

