const express = require('express');
const {
  getRoomSummary,
  getMemberAnalytics,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All dashboard routes require authentication

router.get('/summary', getRoomSummary);
router.get('/member-analytics/:userId', getMemberAnalytics);

module.exports = router;
