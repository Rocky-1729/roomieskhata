const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get room activity feed logs (paginated)
// @route   GET /api/v1/activity
// @access  Private
const getActivityLogs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      return res.json({
        success: true,
        activities: [],
        pagination: { page: 1, limit: 30, total: 0, pages: 0 },
      });
    }

    const roomId = user.activeRoomId;
    const { page = 1, limit = 30 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const query = { roomId };

    const total = await ActivityLog.countDocuments(query);
    const activities = await ActivityLog.find(query)
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      success: true,
      activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notifications for current user
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      return res.json({
        success: true,
        notifications: [],
      });
    }

    const notifications = await Notification.find({
      userId: req.user.id,
      roomId: user.activeRoomId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      res.status(400);
      throw new Error('You are not active in any room');
    }

    await Notification.updateMany(
      { userId: req.user.id, roomId: user.activeRoomId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
