const Expense = require('../models/Expense');
const RoomMember = require('../models/RoomMember');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { calculateBalances } = require('../services/splitService');
const { emitToRoom } = require('../config/socket');
const { uploadToCloudinary } = require('../middleware/upload');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Helper to delete receipt file (either from Cloudinary or local file system)
const deleteReceiptFile = async (publicId) => {
  if (!publicId) return;

  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  // If it's a Cloudinary publicId (does not end with common extensions)
  if (isCloudinaryConfigured && !publicId.includes('.')) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log('Cloudinary receipt deleted:', publicId);
    } catch (err) {
      console.error('Failed to delete Cloudinary receipt:', err.message);
    }
  } else {
    // Local file path delete
    const filePath = path.join(__dirname, '../../public/uploads', publicId);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Local receipt file deleted:', publicId);
      }
    } catch (err) {
      console.error('Failed to delete local receipt file:', err.message);
    }
  }
};

// @desc    Add a new expense
// @route   POST /api/v1/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      res.status(400);
      throw new Error('You must be a member of a room to add an expense');
    }

    const roomId = user.activeRoomId;
    let { title, amount, category, paidBy, date, splitAmong } = req.body;

    if (!title || !amount || !category || !paidBy) {
      res.status(400);
      throw new Error('Please fill in all required fields (title, amount, category, paidBy)');
    }

    // Convert amount to numeric type
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400);
      throw new Error('Amount must be a positive number');
    }

    // Parse splitAmong array if it's sent as string (Multipart form data behavior)
    if (typeof splitAmong === 'string') {
      try {
        splitAmong = JSON.parse(splitAmong);
      } catch (e) {
        splitAmong = splitAmong.split(',').map(s => s.trim());
      }
    }

    // If splitAmong is empty or invalid, default to all members in the room
    if (!splitAmong || !Array.isArray(splitAmong) || splitAmong.length === 0) {
      const roomMembers = await RoomMember.find({ roomId });
      splitAmong = roomMembers.map(rm => rm.userId.toString());
    }

    // Upload receipt if file exists
    let receiptUrl = '';
    let receiptPublicId = '';
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file);
      receiptUrl = uploadResult.url;
      receiptPublicId = uploadResult.publicId;
    }

    // Create expense
    const expense = await Expense.create({
      roomId,
      title,
      amount: parsedAmount,
      category,
      paidBy,
      splitAmong,
      date: date || new Date(),
      receiptUrl,
      receiptPublicId,
    });

    // Populate paidBy user info
    await expense.populate('paidBy', 'name email avatarUrl');

    // Recalculate balances
    const updatedBalances = await calculateBalances(roomId);

    // Create activity log
    const payer = await User.findById(paidBy);
    const activityLog = await ActivityLog.create({
      roomId,
      userId: req.user.id,
      action: 'add_expense',
      details: `${payer.name} added "${expense.title}" of ₹${expense.amount.toFixed(2)}`,
    });

    // Create Notifications
    const roomMembers = await RoomMember.find({ roomId, userId: { $ne: req.user.id } });
    const notificationPromises = roomMembers.map(m =>
      Notification.create({
        userId: m.userId,
        roomId,
        title: 'New Expense Added',
        message: `${payer.name} added "${expense.title}" (₹${expense.amount})`,
        type: 'expense_added',
      })
    );
    await Promise.all(notificationPromises);

    // Broadcast Socket Event
    emitToRoom(roomId, 'expense_created', {
      expense,
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
      activityLog,
    });

    res.status(201).json({
      success: true,
      expense,
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
    });
  } catch (error) {
    // Cleanup file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get expenses with filter & pagination
// @route   GET /api/v1/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId) {
      return res.json({
        success: true,
        expenses: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    }

    const roomId = user.activeRoomId;
    const { page = 1, limit = 20, month, category, memberId } = req.query;

    const query = { roomId };

    // Month filter: YYYY-MM
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const year = parseInt(month.split('-')[0]);
      const monthIndex = parseInt(month.split('-')[1]) - 1;
      
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Member filter (either paid by or split among)
    if (memberId) {
      query.$or = [
        { paidBy: memberId },
        { splitAmong: memberId }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatarUrl')
      .populate('splitAmong', 'name email avatarUrl')
      .sort({ date: -1, createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      success: true,
      expenses,
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

// @desc    Update an expense
// @route   PUT /api/v1/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    // Find user room and verify membership
    const user = await User.findById(req.user.id);
    if (!user.activeRoomId || user.activeRoomId.toString() !== expense.roomId.toString()) {
      res.status(403);
      throw new Error('Access denied');
    }

    // Only expense creator (paidBy), user who created it (actor), or room admin can update
    const memberRecord = await RoomMember.findOne({ roomId: expense.roomId, userId: req.user.id });
    const isAdmin = memberRecord && memberRecord.role === 'admin';
    const isOwner = expense.paidBy.toString() === req.user.id.toString();

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error('Only the payer or the room admin can update this expense');
    }

    let { title, amount, category, paidBy, date, splitAmong } = req.body;

    // Optional receipt replacement
    if (req.file) {
      // Delete old receipt first
      if (expense.receiptPublicId) {
        await deleteReceiptFile(expense.receiptPublicId);
      }
      const uploadResult = await uploadToCloudinary(req.file);
      expense.receiptUrl = uploadResult.url;
      expense.receiptPublicId = uploadResult.publicId;
    }

    if (title) expense.title = title;
    if (amount) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400);
        throw new Error('Amount must be a positive number');
      }
      expense.amount = parsedAmount;
    }
    if (category) expense.category = category;
    if (paidBy) expense.paidBy = paidBy;
    if (date) expense.date = date;

    if (splitAmong) {
      if (typeof splitAmong === 'string') {
        try {
          splitAmong = JSON.parse(splitAmong);
        } catch (e) {
          splitAmong = splitAmong.split(',').map(s => s.trim());
        }
      }
      if (Array.isArray(splitAmong) && splitAmong.length > 0) {
        expense.splitAmong = splitAmong;
      }
    }

    await expense.save();
    await expense.populate('paidBy', 'name email avatarUrl');

    const updatedBalances = await calculateBalances(expense.roomId);

    // Create activity log
    const activityLog = await ActivityLog.create({
      roomId: expense.roomId,
      userId: req.user.id,
      action: 'update_expense',
      details: `${req.user.name} updated the expense "${expense.title}"`,
    });

    // Broadcast Socket Event
    emitToRoom(expense.roomId, 'expense_updated', {
      expense,
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
      activityLog,
    });

    res.json({
      success: true,
      expense,
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    const roomId = expense.roomId;

    // Check permissions
    const memberRecord = await RoomMember.findOne({ roomId, userId: req.user.id });
    const isAdmin = memberRecord && memberRecord.role === 'admin';
    const isOwner = expense.paidBy.toString() === req.user.id.toString();

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error('Only the payer or the room admin can delete this expense');
    }

    // Delete receipt file from cloud/local storage
    if (expense.receiptPublicId) {
      await deleteReceiptFile(expense.receiptPublicId);
    }

    await Expense.findByIdAndDelete(req.params.id);

    const updatedBalances = await calculateBalances(roomId);

    // Create activity log
    const activityLog = await ActivityLog.create({
      roomId,
      userId: req.user.id,
      action: 'delete_expense',
      details: `${req.user.name} deleted the expense "${expense.title}" (₹${expense.amount})`,
    });

    // Broadcast Socket Event
    emitToRoom(roomId, 'expense_deleted', {
      expenseId: req.params.id,
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
      activityLog,
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully',
      balances: updatedBalances.balances,
      settlements: updatedBalances.settlements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
