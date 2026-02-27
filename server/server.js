const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer for handling file uploads (KYC docs)
const storage = multer.memoryStorage(); // stored in memory → streamed to Cloudinary
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // max 5MB per file
app.use('/api/auth/register', upload.fields([
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'aadhaarImage', maxCount: 1 },
    { name: 'voterIdImage', maxCount: 1 },
    { name: 'passbookImage', maxCount: 1 },
    { name: 'qrCodeImage', maxCount: 1 },
]));

// ── Connect to MongoDB ─────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => { console.error('❌ MongoDB Connection Failed:', err.message); process.exit(1); });

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);


// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', project: 'Krishi Astra Setu', time: new Date() }));

// ── 404 fallback ───────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.path} not found.` }));

// ── Start Server ───────────────────────────────────────────
const { execSync } = require('child_process');

function startServer() {
    const server = app.listen(PORT, () => {
        console.log(`🚀 KAS Server running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  Port ${PORT} is in use. Killing old process and restarting...`);
            try {
                // Find and kill the process using the port (Windows)
                const result = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, { encoding: 'utf8' });
                const pid = result.trim().split(/\s+/).pop();
                if (pid && !isNaN(pid)) {
                    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                    console.log(`✅ Killed old process (PID ${pid}). Retrying in 1s...`);
                }
            } catch (_) { /* no process found or already gone */ }
            setTimeout(startServer, 1000);
        } else {
            console.error('❌ Server error:', err.message);
            process.exit(1);
        }
    });
}

startServer();

