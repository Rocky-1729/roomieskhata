const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a description / title'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  category: {
    type: String,
    enum: [
      'Rent',
      'Electricity',
      'WiFi',
      'Vegetables',
      'Eggs',
      'Chicken',
      'Milk',
      'Petrol',
      'Water',
      'Gas',
      'Other',
    ],
    required: [true, 'Please select a category'],
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  splitAmong: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  receiptUrl: {
    type: String,
    default: '',
  },
  receiptPublicId: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Expense', ExpenseSchema);
