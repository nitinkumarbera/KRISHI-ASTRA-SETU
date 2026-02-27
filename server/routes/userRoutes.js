const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Multer memory storage for document re-uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const kycFields = upload.fields([
    { name: 'passportPhoto', maxCount: 1 }, { name: 'aadhaarImage', maxCount: 1 },
    { name: 'voterIdImage', maxCount: 1 }, { name: 'passbookImage', maxCount: 1 },
    { name: 'qrCodeImage', maxCount: 1 }
]);

// Helper: upload buffer â†’ Cloudinary
async function uploadBuf(file) {
    if (!file) return null;
    const buf = file.buffer || file.data;
    if (!buf) return null;
    return new Promise((res, rej) => {
        const s = cloudinary.uploader.upload_stream(
            { folder: 'krishi_astra_kyc', resource_type: 'image' },
            (e, r) => e ? rej(e) : res(r.secure_url)
        );
        s.end(buf);
    });
}

// â”€â”€ @route   GET /api/user/profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Get the logged-in user's full profile (no password)
// â”€â”€ @access  Private (requires JWT)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) {
        console.error('[GET /profile]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ @route   PUT /api/user/profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Update profile fields (for Pending/Rejected users)
// â”€â”€ @access  Private (requires JWT)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (user.kycStatus === 'Verified') {
            return res.status(403).json({ success: false, message: 'Verified accounts cannot be edited. Contact admin.' });
        }

        const { address, finance } = req.body;
        if (address) user.address = { ...user.address, ...address };
        if (finance) user.finance = { ...user.finance, ...finance };

        user.kycStatus = 'Pending';
        user.rejectionReason = '';

        await user.save();
        res.json({ success: true, message: 'Profile updated and re-submitted for review.' });
    } catch (err) {
        console.error('[PUT /profile]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ @route   PATCH /api/user/update-kyc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Re-submit with new documents (Rejected/Pending users only)
// â”€â”€ @access  Private (requires JWT)
router.patch('/update-kyc', authMiddleware, kycFields, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.kycStatus === 'Verified') {
            return res.status(403).json({ success: false, message: 'Verified accounts cannot be edited.' });
        }

        // Update text fields from body
        const { address, finance, ...rest } = req.body;
        if (address) user.address = { ...user.address, ...JSON.parse(address || '{}') };
        if (finance) user.finance = { ...user.finance, ...JSON.parse(finance || '{}') };

        // Upload any new documents
        const files = req.files || {};
        const [pp, ai, vi, pi, qi] = await Promise.all([
            uploadBuf(files.passportPhoto?.[0]),
            uploadBuf(files.aadhaarImage?.[0]),
            uploadBuf(files.voterIdImage?.[0]),
            uploadBuf(files.passbookImage?.[0]),
            uploadBuf(files.qrCodeImage?.[0])
        ]);
        if (pp) user.documents.passportPhoto = pp;
        if (ai) user.documents.aadhaarImage = ai;
        if (vi) user.documents.voterIdImage = vi;
        if (pi) user.documents.passbookImage = pi;
        if (qi) user.finance.qrCodeUrl = qi;

        // Reset status so Admin reviews again
        user.kycStatus = 'Pending';
        user.rejectionReason = '';

        await user.save();
        res.json({ success: true, message: 'Profile updated and re-submitted for approval!' });
    } catch (err) {
        console.error('[PATCH /update-kyc]', err.message);
        res.status(500).json({ success: false, message: 'Server error during KYC update.' });
    }
});

// â”€â”€ @route   PATCH /api/user/update-qr â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Update only the UPI QR code image (all users, incl. Verified)
// â”€â”€ @access  Private (requires JWT)
router.patch('/update-qr', authMiddleware, upload.single('qrCodeImage'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No QR code image provided.' });

        const url = await uploadBuf(req.file);
        if (!url) return res.status(500).json({ success: false, message: 'Image upload failed.' });

        user.finance.qrCodeUrl = url;
        await user.save();
        res.json({ success: true, message: 'QR Code updated successfully!', qrCodeUrl: url });
    } catch (err) {
        console.error('[PATCH /update-qr]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ @route   PATCH /api/user/edit-profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Update editable profile fields for ANY user (incl. Verified)
//            LOCKED: aadhaarNo, aadhaarImage, voterIdImage
// â”€â”€ @access  Private (requires JWT)
const editFields = upload.fields([
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'passbookImage', maxCount: 1 },
]);
router.patch('/edit-profile', authMiddleware, editFields, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const { firstName, middleName, lastName, gender, dob, mobile, email, address, finance } = req.body;

        // â”€â”€ Personal Info (all editable fields)
        if (firstName) user.name.first = firstName.trim();
        if (middleName !== undefined) user.name.middle = middleName.trim();
        if (lastName) user.name.last = lastName.trim();
        if (gender) user.gender = gender;
        if (dob) user.dob = new Date(dob);
        if (mobile) user.mobile = mobile.trim();
        if (email) user.email = email.trim().toLowerCase();

        // â”€â”€ Address (merge â€” preserves existing sub-fields)
        if (address) {
            const a = typeof address === 'string' ? JSON.parse(address) : address;
            user.address = { ...user.address.toObject?.() ?? user.address, ...a };
        }

        // â”€â”€ Finance / Bank (merge)
        if (finance) {
            const f = typeof finance === 'string' ? JSON.parse(finance) : finance;
            user.finance = { ...user.finance.toObject?.() ?? user.finance, ...f };
        }

        // â”€â”€ Document uploads (passport photo + passbook only â€” aadhaar & voter locked)
        const files = req.files || {};
        const [ppUrl, pbUrl] = await Promise.all([
            uploadBuf(files.passportPhoto?.[0]),
            uploadBuf(files.passbookImage?.[0]),
        ]);
        if (ppUrl) user.documents.passportPhoto = ppUrl;
        if (pbUrl) user.documents.passbookImage = pbUrl;

        await user.save({ validateModifiedOnly: true });
        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('[PATCH /edit-profile]', err.message);
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'Mobile or email already in use.' });
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ @route   POST /api/user/forgot-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Reset password by verifying email + Aadhaar number
// â”€â”€ @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { email, aadhaarNo, newPassword } = req.body;

        if (!email || !aadhaarNo || !newPassword)
            return res.status(400).json({ success: false, message: 'Email, Aadhaar number, and new password are required.' });
        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user)
            return res.status(404).json({ success: false, message: 'No account found with this email address.' });

        if (user.aadhaarNo !== aadhaarNo.trim())
            return res.status(400).json({ success: false, message: 'Aadhaar number does not match our records.' });

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save({ validateModifiedOnly: true });

        res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (err) {
        console.error('[POST /forgot-password]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ @route   PATCH /api/user/change-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Change password (requires current password verification)
// â”€â”€ @access  Private (requires JWT)
router.patch('/change-password', authMiddleware, async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, message: 'Current and new password are required.' });
        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

        if (currentPassword === newPassword)
            return res.status(400).json({ success: false, message: 'New password must be different from current password.' });

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save({ validateModifiedOnly: true });

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        console.error('[PATCH /change-password]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ @route   PATCH /api/user/change-email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Change email (requires current password verification)
// â”€â”€ @access  Private (requires JWT)
router.patch('/change-email', authMiddleware, async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { currentPassword, newEmail } = req.body;

        if (!currentPassword || !newEmail)
            return res.status(400).json({ success: false, message: 'Current password and new email are required.' });

        const emailRegex = /^[\w-.]+@gmail\.com$/i;
        if (!emailRegex.test(newEmail.trim()))
            return res.status(400).json({ success: false, message: 'Email must be a valid @gmail.com address.' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

        const normalized = newEmail.trim().toLowerCase();
        if (normalized === user.email)
            return res.status(400).json({ success: false, message: 'New email must be different from current email.' });

        const exists = await User.findOne({ email: normalized });
        if (exists) return res.status(400).json({ success: false, message: 'This email is already registered to another account.' });

        user.email = normalized;
        await user.save({ validateModifiedOnly: true });

        res.json({ success: true, message: 'Email updated successfully. Please log in again with your new email.' });
    } catch (err) {
        console.error('[PATCH /change-email]', err.message);
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email already in use.' });
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// â”€â”€ @route   GET /api/user/my-analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ @desc    Per-user analytics: renter spend, lender earnings, bookings timeline
// â”€â”€ @access  Private (requires JWT)
router.get('/my-analytics', authMiddleware, async (req, res) => {
    try {
        const Booking = require('../models/Booking');
        const Equipment = require('../models/Equipment');
        const uid = req.user.id;
        const since365 = new Date(Date.now() - 365 * 86400000);

        const [
            // As Renter
            renterBookings,
            renterDailyAgg,
            renterCategoryAgg,
            // As Lender (owner)
            lenderBookings,
            lenderDailyAgg,
            lenderCategoryAgg,
            // My equipment listed
            myEquipmentCount,
        ] = await Promise.all([
            // All renter bookings summary
            Booking.find({ renter: uid })
                .select('status totalAmount totalPrice createdAt equipment rentalDates subtotal platformFee gst')
                .populate('equipment', 'name category')
                .lean(),

            // Renter daily aggregation (last 365 days)
            Booking.aggregate([
                { $match: { renter: require('mongoose').Types.ObjectId.createFromHexString(uid), createdAt: { $gte: since365 } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
                        bookings: { $sum: 1 },
                        spend: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
                        platformFee: { $sum: { $ifNull: ['$platformFee', 0] } },
                        gst: { $sum: { $ifNull: ['$gst', 0] } },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $in: ['$status', ['Cancelled', 'Cancelled_By_Renter', 'Cancelled_By_Lender']] }, 1, 0] } },
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]),

            // Renter category spend
            Booking.aggregate([
                { $match: { renter: require('mongoose').Types.ObjectId.createFromHexString(uid) } },
                { $lookup: { from: 'equipment', localField: 'equipment', foreignField: '_id', as: 'eq' } },
                { $unwind: { path: '$eq', preserveNullAndEmptyArrays: false } },
                { $group: { _id: '$eq.category', spend: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } }, bookings: { $sum: 1 } } },
                { $sort: { spend: -1 } }, { $limit: 8 }
            ]),

            // All lender bookings summary
            Booking.find({ owner: uid })
                .select('status totalAmount totalPrice createdAt equipment rentalDates subtotal platformFee gst renter')
                .populate('equipment', 'name category')
                .lean(),

            // Lender daily aggregation
            Booking.aggregate([
                { $match: { owner: require('mongoose').Types.ObjectId.createFromHexString(uid), createdAt: { $gte: since365 } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
                        bookings: { $sum: 1 },
                        earned: { $sum: { $ifNull: ['$subtotal', 0] } },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $in: ['$status', ['Cancelled', 'Cancelled_By_Renter', 'Cancelled_By_Lender']] }, 1, 0] } },
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]),

            // Lender category earnings
            Booking.aggregate([
                { $match: { owner: require('mongoose').Types.ObjectId.createFromHexString(uid) } },
                { $lookup: { from: 'equipment', localField: 'equipment', foreignField: '_id', as: 'eq' } },
                { $unwind: { path: '$eq', preserveNullAndEmptyArrays: false } },
                { $group: { _id: '$eq.category', earned: { $sum: { $ifNull: ['$subtotal', 0] } }, bookings: { $sum: 1 } } },
                { $sort: { earned: -1 } }, { $limit: 8 }
            ]),

            Equipment.countDocuments({ owner: uid }),
        ]);

        // Summaries from booking lists
        const renterTotal = renterBookings.reduce((s, b) => s + (b.totalAmount || b.totalPrice || 0), 0);
        const renterFee = renterBookings.reduce((s, b) => s + (b.platformFee || 0), 0);
        const renterGst = renterBookings.reduce((s, b) => s + (b.gst || 0), 0);
        const renterCompleted = renterBookings.filter(b => b.status === 'Completed').length;
        const renterCancelled = renterBookings.filter(b => ['Cancelled', 'Cancelled_By_Renter', 'Cancelled_By_Lender'].includes(b.status)).length;

        const lenderTotal = lenderBookings.reduce((s, b) => s + (b.subtotal || 0), 0);
        const lenderCompleted = lenderBookings.filter(b => b.status === 'Completed').length;
        const lenderCancelled = lenderBookings.filter(b => ['Cancelled', 'Cancelled_By_Renter', 'Cancelled_By_Lender'].includes(b.status)).length;

        // Format daily data
        const fmtDaily = (agg, key) => agg.map(d => ({
            date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
            bookings: d.bookings,
            [key]: d[key] || 0,
            platformFee: d.platformFee || 0,
            gst: d.gst || 0,
            completed: d.completed,
            cancelled: d.cancelled,
        }));

        res.json({
            success: true, data: {
                // Renter stats
                renterBookings: renterBookings.length,
                renterCompleted, renterCancelled,
                renterTotalSpend: renterTotal,
                renterFee, renterGst,
                renterDailyData: fmtDaily(renterDailyAgg, 'spend'),
                renterCategoryBreakdown: renterCategoryAgg,
                // Lender stats
                lenderBookings: lenderBookings.length,
                lenderCompleted, lenderCancelled,
                lenderTotalEarned: lenderTotal,
                lenderDailyData: fmtDaily(lenderDailyAgg, 'earned'),
                lenderCategoryBreakdown: lenderCategoryAgg,
                // Equipment
                myEquipmentCount,
            }
        });
    } catch (err) {
        console.error('[GET /my-analytics]', err.message);
        res.status(500).json({ success: false, message: 'Analytics error.' });
    }
});


// ── DELETE /api/user/account ──────────────────────────────────
// @desc    User deletes their own account (requires password confirmation)
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Password is required to delete your account.' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ success: false, message: 'Incorrect password. Account not deleted.' });

        const Equipment = require('../models/Equipment');
        const Booking = require('../models/Booking');
        const Review = require('../models/Review');
        const Notification = require('../models/Notification');

        // Cascade delete all user data
        await Equipment.deleteMany({ owner: req.user.id });
        await Booking.deleteMany({ $or: [{ renter: req.user.id }, { owner: req.user.id }] });
        await Review.deleteMany({ reviewer: req.user.id });
        await Notification.deleteMany({ recipient: req.user.id });
        await User.findByIdAndDelete(req.user.id);

        console.log(`[Self-Delete] User ${user.email} deleted their own account`);
        res.json({ success: true, message: 'Your account and all associated data have been permanently deleted.' });
    } catch (err) {
        console.error('[DELETE /account]', err.message);
        res.status(500).json({ success: false, message: 'Server error during account deletion.' });
    }
});

module.exports = router;





