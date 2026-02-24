const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    createBooking, getMyBookings, getLenderBookings,
    verifyHandover, completeBooking
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

module.exports = router;
