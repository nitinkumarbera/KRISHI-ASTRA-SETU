const jwt = require('jsonwebtoken');

// ── JWT Auth Middleware ─────────────────────────────────────
// Accepts token from either:
//   1. x-auth-token: <token>           (used by the React frontend)
//   2. Authorization: Bearer <token>   (standard REST convention)
// ──────────────────────────────────────────────────────────
module.exports = function authMiddleware(req, res, next) {
    // Try x-auth-token first (frontend default), then fallback to Bearer
    let token = req.headers['x-auth-token'];

    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    }

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
