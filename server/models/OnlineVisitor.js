const mongoose = require('mongoose');

// Tracks currently online visitors — one doc per unique session
const onlineVisitorSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    lastSeen: { type: Date, default: Date.now },
});

module.exports = mongoose.model('OnlineVisitor', onlineVisitorSchema);
