const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    // ── Parties ──────────────────────────────────────────────
    renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },

    // ── Rental Window ────────────────────────────────────────
    rentalDates: {
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    },
    startTime: { type: String },  // "HH:MM" format
    endTime: { type: String },

    // ── Financials ───────────────────────────────────────────
    hours: { type: Number, required: true },
    pricePerHour: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, required: true }, // 5%
    gst: { type: Number, required: true },          // 18% on subtotal
    totalAmount: { type: Number, required: true },

    // ── Security ─────────────────────────────────────────────
    handoverToken: { type: String, required: true }, // 6-digit code shown to renter
    handoverVerifiedAt: { type: Date },              // When owner entered token

    // ── Status ───────────────────────────────────────────────
    status: {
        type: String,
        enum: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Confirmed'
    },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' },
    cancellationReason: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
