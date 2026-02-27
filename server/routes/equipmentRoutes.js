const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const {
    addEquipment, getAllEquipment, searchEquipment,
    getEquipmentById, getMyEquipment, toggleAvailability
} = require('../controllers/equipmentController');

// Multer for equipment images (up to 5 photos)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 5 } });

// @route   GET  /api/equipment/all
router.get('/all', getAllEquipment);

// @route   GET  /api/equipment/search?category=&district=&minPrice=&maxPrice=&search=
router.get('/search', searchEquipment);

// @route   GET  /api/equipment/my
router.get('/my', authMiddleware, getMyEquipment);

// @route   POST /api/equipment/add
router.post('/add', authMiddleware, upload.array('equipmentImages', 5), addEquipment);

// @route   GET  /api/equipment/:id  (must be AFTER named routes like /my, /all, /search)
router.get('/:id', getEquipmentById);

// @route   PATCH /api/equipment/:id/toggle
router.patch('/:id/toggle', authMiddleware, toggleAvailability);

module.exports = router;
