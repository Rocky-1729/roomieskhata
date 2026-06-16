const Expense = require('../models/Expense');
const RoomMember = require('../models/RoomMember');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get overall room dashboard metrics
// @route   GET /api/v1/dashboard/summary
// @access  Private
const getRoomSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      return res.json({
        success: true,
        summary: {
          totalExpenses: 0,
          totalMembers: 0,
          averageSpend: 0,
          thisMonthExpenses: 0,
          categoryBreakdown: [],
          topContributors: [],
        },
      });
    }

    const roomId = user.activeRoomId;

    // 1. Total Members
    const totalMembers = await RoomMember.countDocuments({ roomId });

    // 2. Aggregated metrics (Total expenses)
    const totalExpenseResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = totalExpenseResult[0] ? totalExpenseResult[0].total : 0;

    // 3. Average Spend
    const averageSpend = totalMembers > 0 ? Math.round((totalExpenses / totalMembers) * 100) / 100 : 0;

    // 4. This Month's Expenses
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const thisMonthResult = await Expense.aggregate([
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const thisMonthExpenses = thisMonthResult[0] ? thisMonthResult[0].total : 0;

    // 5. Category Breakdown
    const categoryResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: { $round: ['$value', 2] }, _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    // 6. Top Contributors
    const contributorResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
      { $group: { _id: '$paidBy', totalPaid: { $sum: '$amount' } } },
      { $sort: { totalPaid: -1 } },
    ]);

    // Populate user names for top contributors
    const populatedContributors = await Promise.all(
      contributorResult.map(async (c) => {
        const u = await User.findById(c._id).select('name email avatarUrl');
        return {
          user: u,
          totalPaid: Math.round(c.totalPaid * 100) / 100,
          percentage: totalExpenses > 0 ? Math.round((c.totalPaid / totalExpenses) * 10000) / 100 : 0,
        };
      })
    );

    res.json({
      success: true,
      summary: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalMembers,
        averageSpend,
        thisMonthExpenses: Math.round(thisMonthExpenses * 100) / 100,
        categoryBreakdown: categoryResult,
        topContributors: populatedContributors.filter(c => c.user !== null),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analytics for a member
// @route   GET /api/v1/dashboard/member-analytics/:userId
// @access  Private
const getMemberAnalytics = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      res.status(400);
      throw new Error('You must be in a room to view analytics');
    }

    const roomId = user.activeRoomId;
    const targetUserId = new mongoose.Types.ObjectId(req.params.userId);

    // Verify target user is in the room
    const isMember = await RoomMember.findOne({ roomId, userId: targetUserId });
    if (!isMember) {
      res.status(404);
      throw new Error('Member not found in this room');
    }

    // 1. Total paid by member in this room
    const totalPaidResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId), paidBy: targetUserId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPaid = totalPaidResult[0] ? totalPaidResult[0].total : 0;

    // 2. Room total expenses (for percentage calculations)
    const roomTotalResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const roomTotal = roomTotalResult[0] ? roomTotalResult[0].total : 0;
    const contributionPercentage = roomTotal > 0 ? Math.round((totalPaid / roomTotal) * 10000) / 100 : 0;

    // 3. Category breakdown for this member
    const categoryResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId), paidBy: targetUserId } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: { $round: ['$value', 2] }, _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    // 4. Monthly spending trend for this member
    const monthlyTrendResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId), paidBy: targetUserId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = monthlyTrendResult.map((item) => {
      const monthStr = `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`;
      return {
        month: monthStr,
        total: Math.round(item.total * 100) / 100,
      };
    });

    res.json({
      success: true,
      analytics: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        roomTotal: Math.round(roomTotal * 100) / 100,
        contributionPercentage,
        categoryBreakdown: categoryResult,
        monthlyTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoomSummary,
  getMemberAnalytics,
};
