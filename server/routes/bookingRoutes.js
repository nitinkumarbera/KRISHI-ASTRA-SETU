const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    createBooking, getMyBookings, getLenderBookings,
    verifyHandover, completeBooking, uploadRentalPhotos,
    confirmReturn, fileDamageReport, cancelBooking
} = require('../controllers/bookingController');

// @route   POST /api/bookings/create
router.post('/create', authMiddleware, createBooking);

// @route   GET  /api/bookings/my        (renter view)
router.get('/my', authMiddleware, getMyBookings);

// @route   GET  /api/bookings/lender    (owner view)
router.get('/lender', authMiddleware, getLenderBookings);

// @route   POST /api/bookings/verify-handover
router.post('/verify-handover', authMiddleware, verifyHandover);

// @route   PATCH /api/bookings/:id/complete
router.patch('/:id/complete', authMiddleware, completeBooking);

// @route   POST /api/bookings/:id/rental-photos
router.post('/:id/rental-photos', authMiddleware, uploadRentalPhotos);

// @route   PATCH /api/bookings/:id/confirm-return  (renter confirms return)
router.patch('/:id/confirm-return', authMiddleware, confirmReturn);

// @route   PATCH /api/bookings/:id/damage-report   (lender files damage report)
router.patch('/:id/damage-report', authMiddleware, fileDamageReport);

// @route   PATCH /api/bookings/:id/cancel  (renter cancels a Confirmed booking)
router.patch('/:id/cancel', authMiddleware, cancelBooking);

module.exports = router;

