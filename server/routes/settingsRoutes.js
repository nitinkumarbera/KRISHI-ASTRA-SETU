const express = require('express');
const router = express.Router();
const AppSettings = require('../models/AppSettings');
const auth = require('../middleware/auth');

// Helper — get or create the singleton settings doc
async function getSettings() {
    let settings = await AppSettings.findOne({ key: 'global' });
    if (!settings) {
        settings = await AppSettings.create({ key: 'global' });
    }
    return settings;
}

// ── GET /api/settings  (public — used by footer) ────────────
router.get('/', async (req, res) => {
    try {
        const s = await getSettings();
        res.json({ success: true, websiteUrl: s.websiteUrl, appDownloadUrl: s.appDownloadUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load settings.' });
    }
});

// ── PUT /api/settings  (admin only) ─────────────────────────
router.put('/', auth, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    try {
        const { websiteUrl, appDownloadUrl } = req.body;
        const s = await AppSettings.findOneAndUpdate(
            { key: 'global' },
            { websiteUrl: websiteUrl || '', appDownloadUrl: appDownloadUrl || '' },
            { upsert: true, new: true }
        );
        res.json({ success: true, websiteUrl: s.websiteUrl, appDownloadUrl: s.appDownloadUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save settings.' });
    }
});

module.exports = router;
