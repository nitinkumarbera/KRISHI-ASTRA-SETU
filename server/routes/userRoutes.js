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

// ── @route   PATCH /api/user/update-qr ───────────────────────
// ── @desc    Update only the UPI QR code image (all users, incl. Verified)
// ── @access  Private (requires JWT)
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

// ── @route   PATCH /api/user/edit-profile ────────────────────
// ── @desc    Update editable profile fields for ANY user (incl. Verified)
//            LOCKED: aadhaarNo, aadhaarImage, voterIdImage
// ── @access  Private (requires JWT)
const editFields = upload.fields([
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'passbookImage', maxCount: 1 },
]);
router.patch('/edit-profile', authMiddleware, editFields, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const { firstName, middleName, lastName, gender, dob, mobile, email, address, finance } = req.body;

        // ── Personal Info (all editable fields)
        if (firstName) user.name.first = firstName.trim();
        if (middleName !== undefined) user.name.middle = middleName.trim();
        if (lastName) user.name.last = lastName.trim();
        if (gender) user.gender = gender;
        if (dob) user.dob = new Date(dob);
        if (mobile) user.mobile = mobile.trim();
        if (email) user.email = email.trim().toLowerCase();

        // ── Address (merge — preserves existing sub-fields)
        if (address) {
            const a = typeof address === 'string' ? JSON.parse(address) : address;
            user.address = { ...user.address.toObject?.() ?? user.address, ...a };
        }

        // ── Finance / Bank (merge)
        if (finance) {
            const f = typeof finance === 'string' ? JSON.parse(finance) : finance;
            user.finance = { ...user.finance.toObject?.() ?? user.finance, ...f };
        }

        // ── Document uploads (passport photo + passbook only — aadhaar & voter locked)
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

// ── @route   POST /api/user/forgot-password ──────────────────
// ── @desc    Reset password by verifying email + Aadhaar number
// ── @access  Public
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

// ── @route   PATCH /api/user/change-password ─────────────────
// ── @desc    Change password (requires current password verification)
// ── @access  Private (requires JWT)
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

// ── @route   PATCH /api/user/change-email ────────────────────
// ── @desc    Change email (requires current password verification)
// ── @access  Private (requires JWT)
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

module.exports = router;



