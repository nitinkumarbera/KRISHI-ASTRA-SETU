const Equipment = require('../models/Equipment');
const cloudinary = require('cloudinary').v2;

// Helper: upload buffer to Cloudinary
async function uploadBuf(file) {
    if (!file) return null;
    const buf = file.buffer || file.data;
    if (!buf) return null;
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'krishi_astra_equipment', resource_type: 'image' },
            (err, result) => err ? reject(err) : resolve(result.secure_url)
        );
        stream.end(buf);
    });
}

// ══════════════════════════════════════════════════════════
// @route   POST /api/equipment/add
// @desc    Add new equipment (Verified users only)
// @access  Private
// ══════════════════════════════════════════════════════════
exports.addEquipment = async (req, res) => {
    try {
        if (req.user.kycStatus !== 'Verified') {
            return res.status(403).json({
                success: false,
                message: 'Only KYC-Verified members can list equipment. Please wait for admin approval.'
            });
        }

        const {
            name, category, brand, modelNo, manufactureYear, description,
            horsePower, fuelType, condition,
            priceHr, priceDay,
            village, district, state, pinCode
        } = req.body;

        // Upload equipment images (up to 5)
        const files = req.files || [];
        const imageUrls = await Promise.all(files.map(f => uploadBuf(f)));
        const validUrls = imageUrls.filter(Boolean);

        const equipment = new Equipment({
            owner: req.user.id,
            name, category, brand, modelNo,
            manufactureYear: manufactureYear ? Number(manufactureYear) : undefined,
            description,
            specs: { horsePower, fuelType, condition },
            priceHr: Number(priceHr),
            priceDay: Number(priceDay),
            location: { village, district, state, pinCode },
            images: validUrls
        });

        await equipment.save();

        const populated = await Equipment.findById(equipment._id).populate('owner', 'name mobile');
        res.status(201).json({ success: true, message: 'Equipment listed successfully!', data: populated });

    } catch (err) {
        console.error('[addEquipment]', err.message);
        res.status(500).json({ success: false, message: 'Error listing equipment.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   GET /api/equipment/all
// @desc    Get all available equipment (public marketplace)
// @access  Public
// ══════════════════════════════════════════════════════════
exports.getAllEquipment = async (req, res) => {
    try {
        const items = await Equipment.find({ isAvailable: true })
            .populate('owner', 'name mobile address kycStatus')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: items.length, data: items });
    } catch (err) {
        console.error('[getAllEquipment]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   GET /api/equipment/:id
// @desc    Get single equipment by ID (for booking page)
// @access  Public
// ══════════════════════════════════════════════════════════
exports.getEquipmentById = async (req, res) => {
    try {
        const item = await Equipment.findById(req.params.id)
            .populate('owner', 'name mobile address kycStatus');
        if (!item) return res.status(404).json({ success: false, message: `Equipment not found.` });
        res.json({ success: true, data: item });
    } catch (err) {
        console.error('[getEquipmentById]', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


// ══════════════════════════════════════════════════════════
// @route   GET /api/equipment/search
// @desc    Search/filter equipment by category, price, district, keyword
// @access  Public
// ══════════════════════════════════════════════════════════
exports.searchEquipment = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, district, search } = req.query;
        const query = { isAvailable: true };

        if (category && category !== 'All') query.category = category;
        if (district) query['location.district'] = new RegExp(district, 'i');
        if (search) query['$or'] = [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
        if (minPrice || maxPrice) {
            query.priceHr = {};
            if (minPrice) query.priceHr.$gte = Number(minPrice);
            if (maxPrice) query.priceHr.$lte = Number(maxPrice);
        }

        const items = await Equipment.find(query)
            .populate('owner', 'name mobile address kycStatus')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: items.length, data: items });
    } catch (err) {
        console.error('[searchEquipment]', err.message);
        res.status(500).json({ success: false, message: 'Search failed.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   GET /api/equipment/my
// @desc    Get equipment listed by the logged-in user
// @access  Private
// ══════════════════════════════════════════════════════════
exports.getMyEquipment = async (req, res) => {
    try {
        const items = await Equipment.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   PATCH /api/equipment/:id/toggle
// @desc    Toggle availability (available ↔ rented)
// @access  Private (owner only)
// ══════════════════════════════════════════════════════════
exports.toggleAvailability = async (req, res) => {
    try {
        const item = await Equipment.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Equipment not found.' });
        if (String(item.owner) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'Not authorised.' });

        item.isAvailable = !item.isAvailable;
        await item.save();
        res.json({ success: true, isAvailable: item.isAvailable });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
