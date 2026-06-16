const Settlement = require('../models/Settlement');
const RoomMember = require('../models/RoomMember');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { calculateBalances } = require('../services/splitService');
const { emitToRoom } = require('../config/socket');

// @desc    Get balances and settlement suggestions
// @route   GET /api/v1/settlements/balances
// @access  Private
const getBalancesAndSuggestions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      return res.json({
        success: true,
        balances: [],
        settlements: [],
      });
    }

    const roomId = user.activeRoomId;
    const results = await calculateBalances(roomId);

    res.json({
      success: true,
      balances: results.balances,
      settlements: results.settlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a settlement payment
// @route   POST /api/v1/settlements
// @access  Private
const createSettlement = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      res.status(400);
      throw new Error('You must be in a room to log settlements');
    }

    const roomId = user.activeRoomId;
    const { payerId, payeeId, amount, paymentMethod } = req.body;

    if (!payerId || !payeeId || !amount) {
      res.status(400);
      throw new Error('Please specify payerId, payeeId and amount');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400);
      throw new Error('Amount must be a positive number');
    }

    // Verify both users are members of the same room
    const payerMember = await RoomMember.findOne({ roomId, userId: payerId });
    const payeeMember = await RoomMember.findOne({ roomId, userId: payeeId });

    if (!payerMember || !payeeMember) {
      res.status(400);
      throw new Error('Payer and Payee must belong to your active room');
    }

    // Create settlement
    const settlement = await Settlement.create({
      roomId,
      payerId,
      payeeId,
      amount: parsedAmount,
      paymentMethod: paymentMethod || 'Cash',
      status: 'completed',
    });

    // Populate user names
    await settlement.populate('payerId', 'name email avatarUrl');
    await settlement.populate('payeeId', 'name email avatarUrl');

    const updatedBalances = await calculateBalances(roomId);

    // Create activity log
    const activityLog = await ActivityLog.create({
      roomId,
      userId: req.user.id,
      action: 'settlement',
      details: `${settlement.payerId.name} paid ${settlement.payeeId.name} ₹${settlement.amount.toFixed(2)} via ${settlement.paymentMethod}`,
    });

    // Create Notification for payee
    if (payeeId.toString() !== req.user.id.toString()) {
      await Notification.create({
        userId: payeeId,
        roomId,
        title: 'Payment Received',
        message: `${settlement.payerId.name} logged a payment of ₹${settlement.amount} to you.`,
        type: 'settlement_completed',
      });
    }

    // Broadcast Socket Event
    emitToRoom(roomId, 'settlement_logged', {
      settlement,
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
      activityLog,
    });

    res.status(201).json({
      success: true,
      settlement,
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get settlement history for room
// @route   GET /api/v1/settlements/history
// @access  Private
const getSettlementHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      return res.json({
        success: true,
        settlements: [],
      });
    }

    const roomId = user.activeRoomId;
    const settlements = await Settlement.find({ roomId })
      .populate('payerId', 'name email avatarUrl')
      .populate('payeeId', 'name email avatarUrl')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      settlements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBalancesAndSuggestions,
  createSettlement,
  getSettlementHistory,
};
