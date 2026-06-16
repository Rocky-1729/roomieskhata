const express = require('express');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All notification paths require authentication

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

module.exports = router;
