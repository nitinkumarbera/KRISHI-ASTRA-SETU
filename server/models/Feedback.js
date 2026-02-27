const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: 'General Inquiry', trim: true },
    message: { type: String, required: true, trim: true },
    source: { type: String, enum: ['contact_form', 'quick_feedback'], default: 'contact_form' },
    isRead: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
