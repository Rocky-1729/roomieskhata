const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      // Password is only required if googleId is not present
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default in queries
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple nulls
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  activeRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
  },
}, {
  timestamps: true,
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
