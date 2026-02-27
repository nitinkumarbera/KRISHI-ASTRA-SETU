const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Helper: Upload a single file buffer to Cloudinary ──────
// Works with Multer memoryStorage (file.buffer) or express-fileupload (file.data)
async function uploadToCloudinary(file) {
    if (!file) return null;
    const buffer = file.buffer || file.data;
    if (!buffer) return null;
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'krishi_astra_kyc', resource_type: 'image' },
            (err, result) => err ? reject(err) : resolve(result.secure_url)
        );
        stream.end(buffer);
    });
}

// ══════════════════════════════════════════════════════════
// @route   POST /api/auth/register
// @desc    Register a new Member (uploads KYC docs → Cloudinary)
// @access  Public
// ══════════════════════════════════════════════════════════
exports.registerUser = async (req, res) => {
    try {
        const {
            firstName, middleName, lastName, gender, dob, age,
            mobile, email, aadhaarNo, password,
            houseNo, village, postOffice, gpWard, block,
            policeStation, landmark, district, pinCode, state,
            bankName, branchName, accountNo, ifscCode, upiId, customBankName
        } = req.body;

        // If user selected 'Other', use their custom text instead
        const effectiveBankName = bankName === 'Other' && customBankName ? customBankName.trim() : bankName;

        // 1. Uniqueness check
        const existing = await User.findOne({
            $or: [{ email }, { mobile }, { aadhaarNo }]
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A user with this Email, Mobile, or Aadhaar number already exists.'
            });
        }

        // 2. Upload KYC docs to Cloudinary
        const files = req.files || {};
        const [passportPhotoUrl, aadhaarImageUrl, voterIdImageUrl, passbookImageUrl, qrCodeUrl] = await Promise.all([
            uploadToCloudinary(files.passportPhoto?.[0]),
            uploadToCloudinary(files.aadhaarImage?.[0]),
            uploadToCloudinary(files.voterIdImage?.[0]),
            uploadToCloudinary(files.passbookImage?.[0]),
            uploadToCloudinary(files.qrCodeImage?.[0])
        ]);

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Build and save User document
        const user = new User({
            name: { first: firstName, middle: middleName, last: lastName },
            gender, dob, age, mobile, email, aadhaarNo,
            password: hashedPassword,
            address: { houseNo, village, postOffice, gpWard, block, policeStation, landmark, district, pinCode, state },
            finance: { bankName: effectiveBankName, branchName, accountNo, ifscCode, upiId, qrCodeUrl },
            documents: {
                passportPhoto: passportPhotoUrl,
                aadhaarImage: aadhaarImageUrl,
                voterIdImage: voterIdImageUrl,
                passbookImage: passbookImageUrl
            }
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Your profile is now pending Admin Approval. You can rent or lend once verified.'
        });

    } catch (err) {
        console.error('[registerUser]', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Duplicate entry: Email, Mobile, or Aadhaar already registered.' });
        }
        return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// ══════════════════════════════════════════════════════════
// @route   POST /api/auth/login
// @desc    Login with email + password, returns JWT
// @access  Public
// ══════════════════════════════════════════════════════════
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }

        // 3. Build JWT payload
        const payload = {
            user: {
                id: user._id,
                role: user.role,
                kycStatus: user.kycStatus
            }
        };

        // 4. Sign & return token + full profile
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, async (err, token) => {
            if (err) throw err;

            // Fetch full profile (everything except password) so the
            // frontend doesn't need a second round-trip to get name/address/bank/docs
            const fullUser = await User.findById(user._id).select('-password').lean();

            // Determine redirect route based on role
            const redirect = user.role === 'Admin' ? '/admin-dashboard' : '/marketplace';

            return res.json({
                success: true,
                token,
                redirect,
                user: fullUser     // ← complete user object with name, address, finance, documents, etc.
            });
        });

    } catch (err) {
        console.error('[loginUser]', err.message);
        return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};
