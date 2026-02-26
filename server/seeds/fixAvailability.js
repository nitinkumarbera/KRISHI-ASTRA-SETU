/**
 * One-time migration: fix isAvailable on all equipment
 *   - Equipment with an active booking (Confirmed / In Progress) → isAvailable: false
 *   - All other equipment → isAvailable: true  (if not already set)
 *
 * Run with:  node server/seeds/fixAvailability.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    // 1. Find all currently active bookings
    const active = await Booking.find({ status: { $in: ['Confirmed', 'In Progress'] } }).select('equipment');
    const bookedIds = [...new Set(active.map(b => b.equipment?.toString()).filter(Boolean))];

    console.log(`Found ${bookedIds.length} equipment IDs with active bookings:`, bookedIds);

    // 2. Mark those as unavailable
    if (bookedIds.length > 0) {
        const r1 = await Equipment.updateMany(
            { _id: { $in: bookedIds } },
            { $set: { isAvailable: false } }
        );
        console.log(`Marked ${r1.modifiedCount} equipment as isAvailable: false`);
    }

    // 3. All other equipment: explicitly set isAvailable: true if not already set
    const r2 = await Equipment.updateMany(
        { _id: { $nin: bookedIds }, isAvailable: { $ne: false } },
        { $set: { isAvailable: true } }
    );
    console.log(`Reset ${r2.modifiedCount} equipment to isAvailable: true`);

    await mongoose.disconnect();
    console.log('✅ Done');
})();
