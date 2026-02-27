const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const {
    uploadLenderProof,
    uploadAdminProof,
    adminApprove,
    verifyHandover,
    cancelEscrowBooking
} = require('../controllers/paymentController');

// multer — store file in memory → stream to Cloudinary
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per screenshot
});

// Phase 1: Renter uploads Screenshot #1 (paid Lender)
router.post('/lender-proof/:id', auth, upload.single('screenshot'), uploadLenderProof);

// Phase 3a: Renter uploads Screenshot #2 (paid Admin/Platform)
router.post('/admin-proof/:id', auth, upload.single('screenshot'), uploadAdminProof);

// Phase 3b: Admin approves both screenshots
router.patch('/admin-approve/:id', auth, adminApprove);

// Phase 4: Lender enters 6-digit code → starts rental
router.post('/verify-handover/:id', auth, verifyHandover);

// Cancel: Renter or Lender cancels before Rental_Started
router.patch('/cancel/:id', auth, cancelEscrowBooking);

module.exports = router;
