const mongoose = require('mongoose');

// Singleton document — one settings record for the whole app
const AppSettingsSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true },
    websiteUrl: { type: String, default: '' },
    appDownloadUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', AppSettingsSchema);
