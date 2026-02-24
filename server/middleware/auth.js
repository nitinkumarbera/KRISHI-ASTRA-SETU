const jwt = require('jsonwebtoken');

// ── JWT Auth Middleware ─────────────────────────────────────
// Attach this to any route you want to protect.
// Usage: router.get('/profile', authMiddleware, handler)
// ──────────────────────────────────────────────────────────
module.exports = function authMiddleware(req, res, next) {
    // Expect:  Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;   // { id, role, kycStatus }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};
