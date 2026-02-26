const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { addReview, getEquipmentReviews } = require('../controllers/reviewController');

router.post('/', protect, addReview);
router.get('/equipment/:equipmentId', getEquipmentReviews);

module.exports = router;
