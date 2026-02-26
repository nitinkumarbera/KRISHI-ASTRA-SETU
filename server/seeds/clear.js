/**
 * ════════════════════════════════════════════════════════
 *  KRISHI ASTRA SETU — Database Cleaner
 *  Removes ALL fake seed data but keeps the Admin account.
 *  Usage: node seeds/clear.js
 * ════════════════════════════════════════════════════════
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');

async function clear() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Remove all Member/test users, keep Admin
        const { deletedCount: usersDeleted } = await User.deleteMany({ role: { $ne: 'Admin' } });
        console.log(`🗑️  Deleted ${usersDeleted} test user(s)`);

        // Remove all equipment
        const { deletedCount: equipDeleted } = await Equipment.deleteMany({});
        console.log(`🗑️  Deleted ${equipDeleted} equipment listing(s)`);

        // Remove all bookings
        const { deletedCount: bookingsDeleted } = await Booking.deleteMany({});
        console.log(`🗑️  Deleted ${bookingsDeleted} booking(s)`);

        // Remove reviews if the model exists
        try {
            const Review = require('../models/Review');
            const { deletedCount: reviewsDeleted } = await Review.deleteMany({});
            console.log(`🗑️  Deleted ${reviewsDeleted} review(s)`);
        } catch { /* Review model may not exist */ }

        console.log('\n✅ Database is now clean!');
        console.log('   Admin account is preserved.');
        console.log('   You can now register real users and add real equipment.\n');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

clear();
