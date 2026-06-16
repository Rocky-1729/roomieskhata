const express = require('express');
const { getActivityLogs } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All activity log requests require authentication

router.get('/', getActivityLogs);

module.exports = router;
