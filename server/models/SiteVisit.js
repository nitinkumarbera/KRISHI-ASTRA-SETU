const mongoose = require('mongoose');

// One document per calendar day
const siteVisitSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
    count: { type: Number, default: 0 },
});

module.exports = mongoose.model('SiteVisit', siteVisitSchema);
