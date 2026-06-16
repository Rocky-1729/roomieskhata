const mongoose = require('mongoose');

const RoomMemberSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can join a specific room only once
RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', RoomMemberSchema);
