const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

// @desc    Add a review for a completed booking
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        // 1. Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // 2. Security Check: Only the renter can review
        if (String(booking.renter) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'You are not authorized to review this booking' });
        }

        // 3. Status Check: Only completed bookings can be reviewed
        if (booking.status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'You can only review completed rentals' });
        }

        // 4. Create the review
        const review = await Review.create({
            renter: booking.renter,
            owner: booking.owner,
            equipment: booking.equipment,
            booking: bookingId,
            rating,
            comment
        });

        // 5. Update Equipment Average Rating and Count
        const reviews = await Review.find({ equipment: booking.equipment });
        const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await Equipment.findByIdAndUpdate(booking.equipment, {
            rating: avgRating.toFixed(1),
            reviewCount: reviews.length
        });

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get reviews for a specific equipment
// @route   GET /api/reviews/equipment/:equipmentId
// @access  Public
exports.getEquipmentReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ equipment: req.params.equipmentId })
            .populate('renter', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
