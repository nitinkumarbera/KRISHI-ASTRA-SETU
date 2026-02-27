const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { createNotification } = require('./notificationController');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helper: stream buffer → Cloudinary ──────────────────────
function uploadToCloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (err, result) => { if (err) reject(err); else resolve(result); }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

// ══════════════════════════════════════════════════════════════
// PHASE 1 — Renter uploads Screenshot #1 (paid Lender)
// POST /api/payments/lender-proof/:id
// ══════════════════════════════════════════════════════════════
exports.uploadLenderProof = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('owner', 'name mobile finance')
            .populate('renter', 'name')
            .populate('equipment', 'name');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.renter._id) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Not your booking.' });
        if (booking.status !== 'Confirmed')
            return res.status(400).json({ success: false, message: `Cannot upload proof. Status is "${booking.status}".` });
        if (!req.file)
            return res.status(400).json({ success: false, message: 'No screenshot uploaded.' });

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'kas/payment-proofs/lender');

        booking.lenderPaymentProofUrl = result.secure_url;
        booking.status = 'Lender_Paid';
        await booking.save();

        // Notify lender & admin
        await createNotification({
            recipient: booking.owner._id,
            sender: booking.renter._id,
            type: 'Payment',
            message: `${booking.renter.name.first} has uploaded payment proof for "${booking.equipment.name}". Check your dashboard.`,
            link: '/profile?tab=equipment'
        });

        res.json({
            success: true,
            message: 'Lender payment proof uploaded. Booking is now Lender_Paid.',
            lenderPaymentProofUrl: result.secure_url,
            handoverToken: booking.handoverToken,
            status: booking.status
        });
    } catch (err) {
        console.error('[POST /lender-proof]', err.message);
        res.status(500).json({ success: false, message: 'Server error uploading lender proof.' });
    }
};

// ══════════════════════════════════════════════════════════════
// PHASE 3 — Renter uploads Screenshot #2 (paid Admin/Platform)
// POST /api/payments/admin-proof/:id
// ══════════════════════════════════════════════════════════════
exports.uploadAdminProof = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('owner', '_id name')
            .populate('renter', '_id name')
            .populate('equipment', 'name');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.renter._id) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Not your booking.' });
        if (booking.status !== 'Lender_Paid')
            return res.status(400).json({ success: false, message: `Cannot upload admin proof yet. Status is "${booking.status}".` });
        if (!req.file)
            return res.status(400).json({ success: false, message: 'No screenshot uploaded.' });

        const result = await uploadToCloudinary(req.file.buffer, 'kas/payment-proofs/admin');

        booking.adminPaymentProofUrl = result.secure_url;
        booking.status = 'Admin_Paid_Pending';
        await booking.save();

        res.json({
            success: true,
            message: 'Admin payment proof uploaded. Waiting for admin approval.',
            adminPaymentProofUrl: result.secure_url,
            status: booking.status
        });
    } catch (err) {
        console.error('[POST /admin-proof]', err.message);
        res.status(500).json({ success: false, message: 'Server error uploading admin proof.' });
    }
};

// ══════════════════════════════════════════════════════════════
// PHASE 3 — Admin approves both payment screenshots
// PATCH /api/payments/admin-approve/:id
// ══════════════════════════════════════════════════════════════
exports.adminApprove = async (req, res) => {
    try {
        if (!req.user.role || req.user.role.toLowerCase() !== 'admin')
            return res.status(403).json({ success: false, message: 'Admin only.' });

        const booking = await Booking.findById(req.params.id)
            .populate('renter', '_id name')
            .populate('owner', '_id name')
            .populate('equipment', 'name');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (booking.status !== 'Admin_Paid_Pending')
            return res.status(400).json({ success: false, message: `Cannot approve. Status is "${booking.status}".` });

        booking.status = 'Admin_Approved';
        booking.paymentStatus = 'Paid';
        await booking.save();

        // Notify renter to go meet lender
        await createNotification({
            recipient: booking.renter._id,
            sender: null,
            type: 'Payment',
            message: `✅ Admin approved your payments for "${booking.equipment.name}". You can now go meet the lender and provide your 6-digit Handover Code: ${booking.handoverToken}`,
            link: '/profile?tab=bookings'
        });

        // Notify lender to expect renter
        await createNotification({
            recipient: booking.owner._id,
            sender: null,
            type: 'Payment',
            message: `✅ Payments verified for "${booking.equipment.name}". Please await the renter's visit and enter their 6-digit code to start the rental.`,
            link: '/profile?tab=equipment'
        });

        res.json({ success: true, message: 'Booking approved. Renter and Lender notified.', status: booking.status });
    } catch (err) {
        console.error('[PATCH /admin-approve]', err.message);
        res.status(500).json({ success: false, message: 'Server error approving booking.' });
    }
};

// ══════════════════════════════════════════════════════════════
// PHASE 4 — Lender verifies 6-digit Handover Code → starts rental
// POST /api/payments/verify-handover/:id
// ══════════════════════════════════════════════════════════════
exports.verifyHandover = async (req, res) => {
    try {
        const { code } = req.body;
        const booking = await Booking.findById(req.params.id)
            .populate('renter', '_id name')
            .populate('owner', '_id name')
            .populate('equipment', 'name');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.owner._id) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Only the equipment lender can verify the handover.' });
        if (booking.status !== 'Admin_Approved')
            return res.status(400).json({ success: false, message: `Cannot start rental. Status is "${booking.status}".` });
        if (!code || code.trim() !== booking.handoverToken)
            return res.status(400).json({ success: false, message: 'Invalid Handover Code. Please ask the renter to show their code.' });

        booking.status = 'Rental_Started';
        booking.handoverVerifiedAt = new Date();
        await booking.save();

        // Notify both parties
        await createNotification({
            recipient: booking.renter._id,
            sender: booking.owner._id,
            type: 'Booking',
            message: `🎉 Rental started for "${booking.equipment.name}"! Enjoy your rental period.`,
            link: '/profile?tab=bookings'
        });

        res.json({
            success: true,
            message: '✅ Handover verified! Rental has officially started.',
            status: booking.status,
            handoverVerifiedAt: booking.handoverVerifiedAt
        });
    } catch (err) {
        console.error('[POST /verify-handover]', err.message);
        res.status(500).json({ success: false, message: 'Server error verifying handover.' });
    }
};

// ══════════════════════════════════════════════════════════════
// CANCEL — Renter or Lender cancels before Rental_Started
// PATCH /api/payments/cancel/:id
// ══════════════════════════════════════════════════════════════
exports.cancelEscrowBooking = async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await Booking.findById(req.params.id)
            .populate('equipment', 'name _id')
            .populate('renter', '_id name')
            .populate('owner', '_id name');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        const isRenter = String(booking.renter._id) === String(req.user.id);
        const isLender = String(booking.owner._id) === String(req.user.id);
        if (!isRenter && !isLender)
            return res.status(403).json({ success: false, message: 'Not your booking.' });

        // Can only cancel before rental actually starts
        const cancelable = ['Confirmed', 'Lender_Paid', 'Admin_Paid_Pending', 'Admin_Approved'];
        if (!cancelable.includes(booking.status))
            return res.status(400).json({ success: false, message: `Cannot cancel at this stage (${booking.status}).` });

        booking.status = isRenter ? 'Cancelled_By_Renter' : 'Cancelled_By_Lender';
        booking.cancellationReason = reason || 'No reason provided';
        await booking.save();

        // Re-mark equipment as available
        await Equipment.findByIdAndUpdate(booking.equipment._id, { isAvailable: true });

        const otherParty = isRenter ? booking.owner._id : booking.renter._id;
        await createNotification({
            recipient: otherParty,
            sender: req.user.id,
            type: 'Booking',
            message: `❌ Booking for "${booking.equipment.name}" was cancelled by the ${isRenter ? 'Renter' : 'Lender'}. Reason: ${reason || 'Not specified'}`,
            link: '/profile?tab=bookings'
        });

        res.json({ success: true, message: 'Booking cancelled.', status: booking.status });
    } catch (err) {
        console.error('[PATCH /cancel]', err.message);
        res.status(500).json({ success: false, message: 'Server error cancelling booking.' });
    }
};
