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
          roomBudget: {
            totalMembers: 0,
            roomRent: 0,
            rentShare: 0,
            monthlyContribution: 0,
            totalRoomExpenses: 0,
            totalRemainingBudget: 0,
            totalExtraExpenses: 0,
          },
          myBudget: {
            allocatedBudget: 0,
            rentShare: 0,
            spent: 0,
            remaining: 0,
            extra: 0,
            status: 'Within Budget',
          },
          memberTable: [],
          charts: {
            categoryPie: [],
            memberBar: [],
            topCategories: [],
            topMembers: [],
          },
          insights: {
            highestCategory: { name: 'None', value: 0 },
            highestSpender: { name: 'None', spent: 0 },
            efficientMember: { name: 'None', remaining: 0 },
            totalRemainingBudget: 0,
            overspendingAlerts: [],
          }
        },
      });
    }

    const roomId = user.activeRoomId;
    const Room = require('../models/Room');
    const room = await Room.findById(roomId);

    if (!room) {
      return res.json({
        success: true,
        summary: {
          totalExpenses: 0,
          totalMembers: 0,
          averageSpend: 0,
          thisMonthExpenses: 0,
          categoryBreakdown: [],
          topContributors: [],
          roomBudget: {
            totalMembers: 0,
            roomRent: 0,
            rentShare: 0,
            monthlyContribution: 0,
            totalRoomExpenses: 0,
            totalRemainingBudget: 0,
            totalExtraExpenses: 0,
          },
          myBudget: {
            allocatedBudget: 0,
            rentShare: 0,
            spent: 0,
            remaining: 0,
            extra: 0,
            status: 'Within Budget',
          },
          memberTable: [],
          charts: {
            categoryPie: [],
            memberBar: [],
            topCategories: [],
            topMembers: [],
          },
          insights: {
            highestCategory: { name: 'None', value: 0 },
            highestSpender: { name: 'None', spent: 0 },
            efficientMember: { name: 'None', remaining: 0 },
            totalRemainingBudget: 0,
            overspendingAlerts: [],
          }
        },
      });
    }

    // 1. Members
    const memberMappings = await RoomMember.find({ roomId }).populate('userId', 'name email avatarUrl');
    const members = memberMappings.map(m => {
      if (!m.userId) return null;
      return {
        _id: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        avatarUrl: m.userId.avatarUrl,
        role: m.role,
      };
    }).filter(Boolean);

    // 2. All time room total
    const totalExpenseResult = await Expense.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = totalExpenseResult[0] ? totalExpenseResult[0].total : 0;

    // 3. Current month date range
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // 4. This month's room total
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

    // 5. Member budget table data
    const memberBudgetStats = await Promise.all(
      members.map(async (m) => {
        const spentResult = await Expense.aggregate([
          {
            $match: {
              roomId: new mongoose.Types.ObjectId(roomId),
              paidBy: new mongoose.Types.ObjectId(m._id),
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const spent = spentResult[0] ? spentResult[0].total : 0;
        const allocatedBudget = room.allocatedBudget || 0;
        const rentShare = room.rentSharePerPerson || 0;
        
        const remaining = Math.max(0, allocatedBudget - rentShare - spent);
        const extra = (rentShare + spent > allocatedBudget) ? (rentShare + spent - allocatedBudget) : 0;
        const status = (rentShare + spent > allocatedBudget) ? 'Over Budget' : 'Within Budget';
        return {
          userId: m._id,
          name: m.name,
          avatarUrl: m.avatarUrl,
          budget: allocatedBudget,
          allocatedBudget: allocatedBudget,
          rentShare,
          spent,
          remaining,
          extra,
          status,
        };
      })
    );

    // 6. Logged-in user budget status
    const myStats = memberBudgetStats.find(s => s.userId.toString() === req.user.id.toString()) || {
      allocatedBudget: room.allocatedBudget || 0,
      budget: room.allocatedBudget || 0,
      rentShare: room.rentSharePerPerson || 0,
      spent: 0,
      remaining: Math.max(0, (room.allocatedBudget || 0) - (room.rentSharePerPerson || 0)),
      extra: 0,
      status: 'Within Budget',
    };

    // 7. Category Breakdown Pie (current month)
    const categoryResult = await Expense.aggregate([
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: { $round: ['$value', 2] }, _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    // Attach percentages to categories
    const categoryBreakdownWithPct = categoryResult.map(c => ({
      name: c.name,
      value: c.value,
      percentage: thisMonthExpenses > 0 ? Math.round((c.value / thisMonthExpenses) * 100) : 0
    }));

    // 8. Member Spending Comparison (current month)
    const memberBar = memberBudgetStats.map(m => ({
      name: m.name,
      spent: m.spent,
    }));

    // 9. Top Categories (rank highest to lowest)
    const topCategories = [...categoryBreakdownWithPct].sort((a, b) => b.value - a.value);

    // 10. Top Members (rank highest to lowest)
    const topMembers = [...memberBudgetStats]
      .map(m => ({ name: m.name, spent: m.spent, avatarUrl: m.avatarUrl }))
      .sort((a, b) => b.spent - a.spent);

    // 11. Room Budget Statistics
    const totalRemainingBudget = memberBudgetStats.reduce((sum, m) => sum + m.remaining, 0);
    const totalExtraExpenses = memberBudgetStats.reduce((sum, m) => sum + m.extra, 0);

    // 12. Insights
    const highestCategory = categoryResult.length > 0 ? categoryResult[0] : { name: 'None', value: 0 };
    
    let highestSpender = { name: 'None', spent: 0 };
    if (memberBudgetStats.length > 0) {
      const sortedSpenders = [...memberBudgetStats].sort((a, b) => b.spent - a.spent);
      highestSpender = { name: sortedSpenders[0].name, spent: sortedSpenders[0].spent };
    }

    let efficientMember = { name: 'None', remaining: 0 };
    const withinBudgetMembers = memberBudgetStats.filter(m => m.status === 'Within Budget');
    if (withinBudgetMembers.length > 0) {
      const sortedEfficient = withinBudgetMembers.sort((a, b) => b.remaining - a.remaining);
      efficientMember = { name: sortedEfficient[0].name, remaining: sortedEfficient[0].remaining };
    } else if (memberBudgetStats.length > 0) {
      const sortedEfficient = [...memberBudgetStats].sort((a, b) => b.remaining - a.remaining);
      efficientMember = { name: sortedEfficient[0].name, remaining: sortedEfficient[0].remaining };
    }

    const overspendingAlerts = memberBudgetStats
      .filter(m => m.status === 'Over Budget')
      .map(m => ({ name: m.name, extra: m.extra }));

    res.json({
      success: true,
      summary: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalMembers: members.length,
        averageSpend: members.length > 0 ? Math.round((totalExpenses / members.length) * 100) / 100 : 0,
        thisMonthExpenses: Math.round(thisMonthExpenses * 100) / 100,
        categoryBreakdown: categoryBreakdownWithPct,
        topContributors: memberBudgetStats.map(m => ({
          user: { name: m.name, avatarUrl: m.avatarUrl, _id: m.userId },
          totalPaid: m.spent,
          percentage: thisMonthExpenses > 0 ? Math.round((m.spent / thisMonthExpenses) * 10000) / 100 : 0,
        })),
        roomBudget: {
          totalMembers: members.length,
          roomRent: room.roomRent || 0,
          rentShare: room.rentSharePerPerson || 0,
          monthlyContribution: room.monthlyContribution || 0,
          totalRoomExpenses: thisMonthExpenses,
          totalRemainingBudget,
          totalExtraExpenses,
        },
        myBudget: myStats,
        memberTable: memberBudgetStats,
        charts: {
          categoryPie: categoryBreakdownWithPct,
          memberBar,
          topCategories,
          topMembers,
        },
        insights: {
          highestCategory,
          highestSpender,
          efficientMember,
          totalRemainingBudget,
          overspendingAlerts,
        }
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
