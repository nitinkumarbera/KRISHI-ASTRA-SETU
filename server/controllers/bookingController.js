const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { createNotification } = require('./notificationController');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

        // Mark equipment as unavailable so it disappears from the marketplace while rented
        await Equipment.findByIdAndUpdate(equipmentId, { isAvailable: false });

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
            .populate('renter', 'name mobile email address finance')
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

        booking.status = 'Rental_Started';
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
// @desc    Mark booking as Completed (lender only)
// @access  Private (owner only)
// ══════════════════════════════════════════════════════════
exports.completeBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('renter', 'name')
            .populate('equipment', 'name');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.owner) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Not authorised.' });

        booking.status = 'Completed';
        booking.paymentStatus = 'Paid';
        await booking.save();

        // Re-mark equipment as available
        await Equipment.findByIdAndUpdate(booking.equipment._id || booking.equipment, { isAvailable: true });

        // Notify renter
        await createNotification({
            recipient: booking.renter._id || booking.renter,
            sender: req.user.id,
            type: 'Booking',
            message: `Your rental of "${booking.equipment?.name || 'equipment'}" is now complete! Please leave a review.`,
            link: '/profile?tab=rentals'
        });
        // Notify lender (self)
        await createNotification({
            recipient: req.user.id,
            sender: booking.renter._id || booking.renter,
            type: 'Booking',
            message: `Rental closed for "${booking.equipment?.name || 'equipment'}". Don't forget to leave a review!`,
            link: '/profile?tab=equipment'
        });

        res.json({ success: true, message: 'Booking marked as completed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   POST /api/bookings/:id/rental-photos
// @desc    Renter uploads geo-tagged proof-of-use photos
// @access  Private (renter of this booking only)
// ══════════════════════════════════════════════════════════
exports.uploadRentalPhotos = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.renter) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Only the renter can upload rental photos.' });
        if (booking.status !== 'Rental_Started')
            return res.status(400).json({ success: false, message: 'Photos can only be uploaded while rental is in progress.' });

        const { photos } = req.body; // [{ base64, lat, lng, address, takenAt }]
        if (!photos || !photos.length)
            return res.status(400).json({ success: false, message: 'No photos provided.' });
        if (photos.length > 5)
            return res.status(400).json({ success: false, message: 'Maximum 5 photos per upload.' });
        if (booking.rentalPhotos.length + photos.length > 20)
            return res.status(400).json({ success: false, message: 'Maximum 20 proof photos per rental.' });

        const uploaded = [];
        for (const photo of photos) {
            const result = await cloudinary.uploader.upload(photo.base64, {
                folder: 'rental-photos',
                resource_type: 'image',
            });
            uploaded.push({
                url: result.secure_url,
                lat: photo.lat,
                lng: photo.lng,
                address: photo.address || '',
                takenAt: photo.takenAt ? new Date(photo.takenAt) : new Date(),
            });
        }

        booking.rentalPhotos.push(...uploaded);
        await booking.save();

        res.json({ success: true, message: `${uploaded.length} photo(s) uploaded.`, data: booking.rentalPhotos });
    } catch (err) {
        console.error('[uploadRentalPhotos]', err.message);
        res.status(500).json({ success: false, message: 'Server error during photo upload.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   PATCH /api/bookings/:id/confirm-return
// @desc    Renter confirms they have returned the equipment
// @access  Private (renter only)
// ══════════════════════════════════════════════════════════
exports.confirmReturn = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('equipment', 'name');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.renter) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Only the renter can confirm return.' });
        if (booking.status !== 'Rental_Started')
            return res.status(400).json({ success: false, message: 'Return can only be confirmed during an active rental.' });
        if (booking.returnConfirmedByRenter)
            return res.status(400).json({ success: false, message: 'Return already confirmed.' });

        booking.returnConfirmedByRenter = true;
        booking.returnConfirmedAt = new Date();
        await booking.save();

        // Notify lender
        await createNotification({
            recipient: booking.owner,
            sender: req.user.id,
            type: 'Booking',
            message: `Renter has confirmed return of "${booking.equipment?.name || 'equipment'}". Please verify and close the rental.`,
            link: '/profile?tab=equipment'
        });

        res.json({ success: true, message: 'Return confirmed. The lender has been notified.', data: booking });
    } catch (err) {
        console.error('[confirmReturn]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   PATCH /api/bookings/:id/damage-report
// @desc    Lender files a damage report before completing
// @access  Private (owner only)
// ══════════════════════════════════════════════════════════
exports.fileDamageReport = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('equipment', 'name');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (String(booking.owner) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Only the equipment owner can file a damage report.' });
        if (booking.status !== 'Rental_Started')
            return res.status(400).json({ success: false, message: 'Damage report can only be filed during an active rental.' });

        const { description, severity, photos } = req.body;
        if (!description || !severity)
            return res.status(400).json({ success: false, message: 'Description and severity are required.' });

        // Upload damage photos to Cloudinary
        const uploadedPhotos = [];
        for (const base64 of (photos || [])) {
            const result = await cloudinary.uploader.upload(base64, {
                folder: 'damage-reports',
                resource_type: 'image',
            });
            uploadedPhotos.push({ url: result.secure_url });
        }

        booking.damageReport = {
            filed: true,
            description,
            severity,
            photos: uploadedPhotos,
            filedAt: new Date()
        };
        await booking.save();

        // Notify renter
        await createNotification({
            recipient: booking.renter,
            sender: req.user.id,
            type: 'Booking',
            message: `⚠️ The lender has filed a ${severity} damage report for "${booking.equipment?.name || 'equipment'}". Please review.`,
            link: '/profile?tab=rentals'
        });

        res.json({ success: true, message: 'Damage report filed successfully.', data: booking.damageReport });
    } catch (err) {
        console.error('[fileDamageReport]', err.message);
        res.status(500).json({ success: false, message: 'Server error during damage report.' });
    }
};
// ══════════════════════════════════════════════════════════
// @route   PATCH /api/bookings/:id/cancel
// @desc    Renter cancels a Confirmed booking (not yet In Progress)
// @access  Private (renter only)
// ══════════════════════════════════════════════════════════
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('equipment', 'name');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        // Only renter OR lender (owner) can cancel
        const isRenter = String(booking.renter) === String(req.user.id);
        const isLender = String(booking.owner) === String(req.user.id);
        if (!isRenter && !isLender) {
            return res.status(403).json({ success: false, message: 'Not authorised to cancel this booking.' });
        }

        // Can only cancel Confirmed bookings (not In Progress / Completed)
        if (booking.status !== 'Confirmed') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a booking that is already '${booking.status}'.`
            });
        }

        const { reason } = req.body;

        booking.status = 'Cancelled';
        booking.paymentStatus = 'Refunded';
        booking.cancellationReason = reason || (isRenter ? 'Cancelled by renter' : 'Cancelled by lender');
        await booking.save();

        // Restore equipment availability
        await Equipment.findByIdAndUpdate(booking.equipment._id, { isAvailable: true });

        // Notify the other party
        const notifyId = isRenter ? booking.owner : booking.renter;
        const notifyMsg = isRenter
            ? `Rental booking for "${booking.equipment.name}" has been cancelled by the renter.`
            : `Rental booking for "${booking.equipment.name}" has been cancelled by the lender.`;

        await createNotification({
            userId: notifyId,
            type: 'Booking',
            title: 'Booking Cancelled',
            message: notifyMsg,
            relatedId: booking._id,
            relatedModel: 'Booking',
        });

        res.json({ success: true, message: 'Booking cancelled successfully. Refund initiated.', data: booking });
    } catch (err) {
        console.error('[cancelBooking]', err.message);
        res.status(500).json({ success: false, message: 'Server error during cancellation.' });
    }
};

