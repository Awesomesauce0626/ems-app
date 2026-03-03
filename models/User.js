const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: {
    type: String,
    enum: ['citizen', 'ems_personnel', 'admin'],
    default: 'citizen',
  },
  // --- ON DUTY STATUS: Whether EMS personnel is currently active and receiving alerts ---
  isOnDuty: {
    type: Boolean,
    default: true, // Default to true so they start receiving alerts
  },
  // --- PUSH NOTIFICATIONS: Field to store user device tokens ---
  fcmTokens: {
    type: [String],
    default: [],
  },
  quickAccessEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
