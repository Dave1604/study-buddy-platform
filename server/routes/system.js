const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/auth');

router.get('/settings', protect, authorize('admin'), getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);

module.exports = router;


