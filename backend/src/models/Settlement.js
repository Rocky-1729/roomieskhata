const mongoose = require('mongoose');

const SettlementSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  payerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  payeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please specify settlement amount'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed',
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Other'],
    default: 'Cash',
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Settlement', SettlementSchema);
