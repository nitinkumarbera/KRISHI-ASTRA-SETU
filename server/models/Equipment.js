const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
    // ── Ownership ───────────────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Equipment Details ───────────────────────────────────
    name: { type: String, trim: true },
    category: { type: String, required: true, trim: true },  // flexible — frontend uses lowercase
    brand: { type: String, trim: true },
    modelNo: { type: String, trim: true },
    manufactureYear: { type: Number },
    description: { type: String, trim: true },

    // ── Technical Specs ─────────────────────────────────────
    specs: {
        horsePower: String,
        fuelType: { type: String, enum: ['Diesel', 'Petrol', 'Electric', 'Other'] },
        condition: { type: String, enum: ['New', 'Good', 'Fair', 'Needs Repair'], default: 'Good' }
    },

    // ── Pricing ─────────────────────────────────────────────
    priceHr: { type: Number, required: true },   // per hour
    priceDay: { type: Number, required: true },  // per day

    // ── Location ────────────────────────────────────────────
    location: {
        houseNo: String,
        landmark: String,
        village: String,
        postOffice: String,
        block: String,
        policeStation: String,
        gpWard: String,
        district: { type: String, required: true },
        state: String,
        pinCode: String,
        lat: Number,
        lng: Number,
        label: String,
    },

    // ── Images (Cloudinary URLs) ─────────────────────────────
    images: [String],

    // ── Status ──────────────────────────────────────────────
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: primary image
EquipmentSchema.virtual('thumbnail').get(function () {
    return this.images?.[0] || null;
});

module.exports = mongoose.model('Equipment', EquipmentSchema);
