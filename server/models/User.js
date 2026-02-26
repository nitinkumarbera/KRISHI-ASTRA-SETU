const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // ── Section 1: Identity & Contact ──────────────────────
    name: {
        first: { type: String, required: true, trim: true },
        middle: { type: String, trim: true },
        last: { type: String, required: true, trim: true }
    },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dob: { type: Date },
    age: { type: Number },
    mobile: { type: String, required: true, unique: true, match: [/^\d{10}$/, 'Mobile must be exactly 10 digits'] },
    email: { type: String, required: true, unique: true, lowercase: true, match: [/^[\w-.]+@gmail\.com$/, 'Must use a valid @gmail.com address'] },
    aadhaarNo: { type: String, required: true, unique: true, minlength: 12, maxlength: 12 },
    password: { type: String, required: true },   // stored as bcrypt hash

    // ── Section 2: Full Address ─────────────────────────────
    address: {
        houseNo: String,
        village: { type: String },
        postOffice: String,
        gpWard: String,
        block: String,
        policeStation: String,
        landmark: String,
        district: { type: String },
        pinCode: { type: String, match: [/^\d{6}$/, 'PIN must be 6 digits'] },
        state: { type: String }
    },

    // ── Section 3: Bank & Payments ──────────────────────────
    finance: {
        bankName: String,
        branchName: String,
        accountNo: String,
        ifscCode: { type: String },
        upiId: String,
        qrCodeUrl: String   // Cloudinary URL
    },

    // ── Section 4: KYC Document URLs (Cloudinary) ──────────
    documents: {
        passportPhoto: String,
        aadhaarImage: String,
        voterIdImage: String,
        passbookImage: String
    },

    // ── System & Status Fields ──────────────────────────────
    role: { type: String, enum: ['Member', 'Admin'], default: 'Member' },
    kycStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    rejectionReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}, {
    // Include virtual fields when converting to JSON (for API responses)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ── Virtual: memberID ────────────────────────────────────────
// Generates a readable ID like KA-NAS-3210 (KrishiAstra + district + last4mobile)
UserSchema.virtual('memberID').get(function () {
    const city = (this.address?.district || 'KAS').substring(0, 3).toUpperCase();
    const phone = (this.mobile || '0000').slice(-4);
    return `KA-${city}-${phone}`;
});

module.exports = mongoose.model('User', UserSchema);

