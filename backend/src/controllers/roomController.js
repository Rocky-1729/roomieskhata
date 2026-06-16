const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const generateRoomCode = require('../utils/generateRoomCode');

const recalculateRoomBudgetHelper = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) return;
  
  room.rentSharePerPerson = room.roomRent > 0 ? Math.round(room.roomRent / (room.maxMembers || 1)) : 0;
  room.allocatedBudget = room.monthlyContribution || 0;
  await room.save();
};

// @desc    Create a new room
// @route   POST /api/v1/rooms
// @access  Private
const createRoom = async (req, res, next) => {
  try {
    const { name, description, maxMembers, monthlyContribution, roomRent } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Please provide a room name');
    }

    // Check if user is already in a room
    const user = await User.findById(req.user.id);
    if (user.activeRoomId) {
      res.status(400);
      throw new Error('You are already a member of an active room. Leave it first.');
    }

    const roomCode = await generateRoomCode();

    const roommatesCount = parseInt(maxMembers) || 1;
    const rentAmount = parseFloat(roomRent) || 0;
    const contributionAmount = parseFloat(monthlyContribution) || 0;

    const rentSharePerPerson = roommatesCount > 0 ? Math.round(rentAmount / roommatesCount) : 0;

    const room = await Room.create({
      name,
      description: description || '',
      roomCode,
      adminId: req.user.id,
      maxMembers: roommatesCount,
      roomRent: rentAmount,
      monthlyContribution: contributionAmount,
      rentSharePerPerson,
      allocatedBudget: contributionAmount,
    });

    // Create RoomMember entry
    await RoomMember.create({
      roomId: room._id,
      userId: req.user.id,
      role: 'admin',
    });

    // Update User activeRoomId
    user.activeRoomId = room._id;
    await user.save();

    // Log Activity
    await ActivityLog.create({
      roomId: room._id,
      userId: req.user.id,
      action: 'create_room',
      details: `${req.user.name} created the room "${room.name}"`,
    });

    res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a room via code
// @route   POST /api/v1/rooms/join
// @access  Private
const joinRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      res.status(400);
      throw new Error('Please provide a room code');
    }

    const formattedCode = roomCode.toUpperCase().trim();
    const room = await Room.findOne({ roomCode: formattedCode });

    if (!room) {
      res.status(404);
      throw new Error('Room not found with the provided code');
    }

    // Check if user is already in a room
    const user = await User.findById(req.user.id);
    if (user.activeRoomId) {
      res.status(400);
      throw new Error('You are already a member of an active room. Leave it first.');
    }

    // Check member limits
    const currentMemberCount = await RoomMember.countDocuments({ roomId: room._id });
    if (currentMemberCount >= room.maxMembers) {
      res.status(400);
      throw new Error('Room is full (limit reached)');
    }

    // Create member entry
    await RoomMember.create({
      roomId: room._id,
      userId: req.user.id,
      role: 'member',
    });

    // Update User activeRoomId
    user.activeRoomId = room._id;
    await user.save();

    // Recalculate per-person budget
    await recalculateRoomBudgetHelper(room._id);

    // Notify other members
    const roomMembers = await RoomMember.find({ roomId: room._id, userId: { $ne: req.user.id } });
    const notificationPromises = roomMembers.map(m =>
      Notification.create({
        userId: m.userId,
        roomId: room._id,
        title: 'New Member Joined',
        message: `${req.user.name} has joined the room!`,
        type: 'member_joined',
      })
    );
    await Promise.all(notificationPromises);

    // Log Activity
    await ActivityLog.create({
      roomId: room._id,
      userId: req.user.id,
      action: 'join_room',
      details: `${req.user.name} joined the room`,
    });

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's active room details
// @route   GET /api/v1/rooms/my-room
// @access  Private
const getMyRoom = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      return res.json({
        success: true,
        room: null,
        members: [],
      });
    }

    const room = await Room.findById(user.activeRoomId);
    if (!room) {
      user.activeRoomId = null;
      await user.save();
      return res.json({
        success: true,
        room: null,
        members: [],
      });
    }

    // Get members details
    const memberMappings = await RoomMember.find({ roomId: room._id }).populate('userId', 'name email avatarUrl');
    const members = memberMappings.map(m => {
      if (!m.userId) return null;
      return {
        _id: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        avatarUrl: m.userId.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      };
    }).filter(Boolean);

    res.json({
      success: true,
      room,
      members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details
// @route   PUT /api/v1/rooms/my-room
// @access  Private
const updateRoom = async (req, res, next) => {
  try {
    const { name, description, maxMembers, roomRent, monthlyContribution } = req.body;

    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      res.status(400);
      throw new Error('You are not in any active room');
    }

    const room = await Room.findById(user.activeRoomId);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    // Check if user is admin
    if (room.adminId.toString() !== req.user.id.toString()) {
      res.status(403);
      throw new Error('Only room admins can update settings');
    }

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (maxMembers) room.maxMembers = parseInt(maxMembers);
    if (roomRent !== undefined) room.roomRent = parseFloat(roomRent) || 0;
    if (monthlyContribution !== undefined) room.monthlyContribution = parseFloat(monthlyContribution) || 0;

    await room.save();

    // Recalculate per-person budget
    await recalculateRoomBudgetHelper(room._id);

    const updatedRoom = await Room.findById(room._id);

    res.json({
      success: true,
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave room
// @route   POST /api/v1/rooms/leave
// @access  Private
const leaveRoom = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      res.status(400);
      throw new Error('You are not in any active room');
    }

    const roomId = user.activeRoomId;
    const room = await Room.findById(roomId);

    if (!room) {
      user.activeRoomId = null;
      await user.save();
      await RoomMember.deleteMany({ userId: req.user.id });
      return res.json({ success: true, message: 'Cleaned up invalid room linkage' });
    }

    const isSharing = await RoomMember.findOne({ roomId, userId: req.user.id });
    if (!isSharing) {
      user.activeRoomId = null;
      await user.save();
      return res.json({ success: true, message: 'Cleaned up invalid room linkage' });
    }

    // Get list of all members
    const members = await RoomMember.find({ roomId });

    if (members.length === 1) {
      // User is the last member, delete the room entirely
      await deleteRoomData(roomId);
    } else {
      // There are other members
      if (room.adminId.toString() === req.user.id.toString()) {
        // If user is admin, promote the next oldest member to admin
        const nextAdmin = members.find(m => m.userId.toString() !== req.user.id.toString());
        room.adminId = nextAdmin.userId;
        await room.save();

        nextAdmin.role = 'admin';
        await nextAdmin.save();

        // Log admin transfer activity
        const nextAdminUser = await User.findById(nextAdmin.userId);
        await ActivityLog.create({
          roomId,
          userId: req.user.id,
          action: 'admin_transfer',
          details: `${req.user.name} promoted ${nextAdminUser ? nextAdminUser.name : 'another member'} to Room Admin`,
        });
      }

      // Remove RoomMember record
      await RoomMember.deleteOne({ roomId, userId: req.user.id });

      // Recalculate room budget
      await recalculateRoomBudgetHelper(roomId);

      // Notify remaining members
      const notifyMembers = members.filter(m => m.userId.toString() !== req.user.id.toString());
      const notificationPromises = notifyMembers.map(m =>
        Notification.create({
          userId: m.userId,
          roomId,
          title: 'Member Left',
          message: `${req.user.name} has left the room.`,
          type: 'reminder',
        })
      );
      await Promise.all(notificationPromises);

      // Log Activity
      await ActivityLog.create({
        roomId,
        userId: req.user.id,
        action: 'leave_room',
        details: `${req.user.name} left the room`,
      });
    }

    // Clear activeRoomId on User
    user.activeRoomId = null;
    await user.save();

    res.json({
      success: true,
      message: 'Successfully left the room',
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to wipe all room-related data
const deleteRoomData = async (roomId) => {
  // Clear activeRoomId for all users in the room
  const members = await RoomMember.find({ roomId });
  const userIds = members.map(m => m.userId);
  await User.updateMany({ _id: { $in: userIds } }, { activeRoomId: null });

  // Delete everything
  await RoomMember.deleteMany({ roomId });
  const Expense = require('../models/Expense');
  const Settlement = require('../models/Settlement');
  await Expense.deleteMany({ roomId });
  await Settlement.deleteMany({ roomId });
  await Notification.deleteMany({ roomId });
  await ActivityLog.deleteMany({ roomId });
  await Room.findByIdAndDelete(roomId);
};

// @desc    Delete Room (Admin only)
// @route   DELETE /api/v1/rooms/my-room
// @access  Private
const deleteMyRoom = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      res.status(400);
      throw new Error('You are not in any active room');
    }

    const roomId = user.activeRoomId;
    const room = await Room.findById(roomId);

    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    // Check if user is admin
    if (room.adminId.toString() !== req.user.id.toString()) {
      res.status(403);
      throw new Error('Only the room admin can delete the room');
    }

    await deleteRoomData(roomId);

    res.json({
      success: true,
      message: 'Room and all associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getMyRoom,
  updateRoom,
  leaveRoom,
  deleteMyRoom,
  recalculateRoomBudgetHelper,
};
