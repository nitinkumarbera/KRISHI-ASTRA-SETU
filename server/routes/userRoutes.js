const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Multer memory storage for document re-uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const kycFields = upload.fields([
    { name: 'passportPhoto', maxCount: 1 }, { name: 'aadhaarImage', maxCount: 1 },
    { name: 'voterIdImage', maxCount: 1 }, { name: 'passbookImage', maxCount: 1 },
    { name: 'qrCodeImage', maxCount: 1 }
]);

// Helper: upload buffer → Cloudinary
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

// ── @route   GET /api/user/profile ───────────────────────────
// ── @desc    Get the logged-in user's full profile (no password)
// ── @access  Private (requires JWT)
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

// ── @route   PUT /api/user/profile ───────────────────────────
// ── @desc    Update profile fields (for Pending/Rejected users)
// ── @access  Private (requires JWT)
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

// ── @route   PATCH /api/user/update-kyc ──────────────────────
// ── @desc    Re-submit with new documents (Rejected/Pending users only)
// ── @access  Private (requires JWT)
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

module.exports = router;

