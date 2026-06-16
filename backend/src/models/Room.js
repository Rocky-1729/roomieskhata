const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a room name'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  roomCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  maxMembers: {
    type: Number,
    default: 10,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Room', RoomSchema);
