const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { createNotification } = require('./notificationController');

// ══════════════════════════════════════════════════════════
// @route   POST /api/bookings/create
// @desc    Create a new booking with price calculation
// @access  Private (Verified users only)
// ══════════════════════════════════════════════════════════
exports.createBooking = async (req, res) => {
    try {
        if (req.user.kycStatus !== 'Verified') {
            return res.status(403).json({
                success: false,
                message: 'Only KYC-Verified members can make bookings. Please complete your KYC first.'
            });
        }

        const { equipmentId, startDate, endDate, startTime, endTime } = req.body;

        const equipment = await Equipment.findById(equipmentId).populate('owner', 'name mobile');
        if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found.' });
        if (!equipment.isAvailable) return res.status(400).json({ success: false, message: 'Equipment is currently not available.' });

        // Prevent renter from booking their own equipment
        if (String(equipment.owner._id) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You cannot book your own equipment.' });
        }

        // ── Price Calculation ────────────────────────────
        const start = new Date(startDate);
        const end = new Date(endDate);
        const msPerHour = 1000 * 60 * 60;
        const hours = Math.max(1, Math.ceil((end - start) / msPerHour));
        const subtotal = hours * equipment.priceHr;
        const platformFee = Math.round(subtotal * 0.05);  // 5%
        const gst = Math.round(subtotal * 0.18);          // 18%
        const totalAmount = subtotal + platformFee + gst;

        // ── Generate 6-digit Handover Token ─────────────
        const handoverToken = String(Math.floor(100000 + Math.random() * 900000));

        const booking = new Booking({
            renter: req.user.id,
            owner: equipment.owner._id,
            equipment: equipmentId,
            rentalDates: { start, end },
            startTime, endTime,
            hours, pricePerHour: equipment.priceHr,
            subtotal, platformFee, gst, totalAmount,
            handoverToken
        });

        await booking.save();

        const populated = await Booking.findById(booking._id)
            .populate('equipment', 'name category images priceHr location')
            .populate('owner', 'name mobile')
            .populate('renter', 'name mobile email');

        // ── Trigger Notification for Lender ──────────────
        await createNotification({
            recipient: equipment.owner._id,
            sender: req.user.id,
            type: 'Booking',
            message: `New Booking! ${populated.renter.name.first} has booked your ${equipment.name}.`,
            link: '/profile?tab=equipment'
        });

        res.status(201).json({
            success: true,
            message: 'Booking confirmed!',
            data: populated,
            handoverToken,
            pricing: { hours, subtotal, platformFee, gst, total: totalAmount }
        });

    } catch (err) {
        console.error('[createBooking]', err.message);
        res.status(500).json({ success: false, message: 'Booking failed. Please try again.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   GET /api/bookings/my
// @desc    Get all bookings where user is renter
// @access  Private
// ══════════════════════════════════════════════════════════
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ renter: req.user.id })
            .populate('equipment', 'name category images priceHr location brand')
            .populate('owner', 'name mobile')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   GET /api/bookings/lender
// @desc    Get all rental requests where user is owner
// @access  Private
// ══════════════════════════════════════════════════════════
exports.getLenderBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ owner: req.user.id })
            .populate('equipment', 'name category images priceHr')
            .populate('renter', 'name mobile email address')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   POST /api/bookings/verify-handover
// @desc    Owner enters token → starts rental
// @access  Private (owner only)
// ══════════════════════════════════════════════════════════
exports.verifyHandover = async (req, res) => {
    const { bookingId, enteredToken } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.owner) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Only the equipment owner can verify handover.' });
        if (booking.handoverToken !== enteredToken)
            return res.status(400).json({ success: false, message: 'Invalid Handover Token. Please check with the renter.' });

        booking.status = 'In Progress';
        booking.handoverVerifiedAt = new Date();
        await booking.save();

        // ── Trigger Notification for Renter ──────────────
        await createNotification({
            recipient: booking.renter,
            sender: req.user.id,
            type: 'Booking',
            message: `Handover Verified! Your rental for order #${booking._id.toString().slice(-6)} has started.`,
            link: '/profile?tab=rentals'
        });

        res.json({ success: true, message: 'Handover verified! Rental period has officially started.' });
    } catch (err) {
        console.error('[verifyHandover]', err.message);
        res.status(500).json({ success: false, message: 'Server error during handover.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   PATCH /api/bookings/:id/complete
// @desc    Mark booking as Completed
// @access  Private (owner only)
// ══════════════════════════════════════════════════════════
exports.completeBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.owner) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Not authorised.' });

        booking.status = 'Completed';
        booking.paymentStatus = 'Paid';
        await booking.save();

        // Re-mark equipment as available
        await Equipment.findByIdAndUpdate(booking.equipment, { isAvailable: true });

        res.json({ success: true, message: 'Booking marked as completed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
