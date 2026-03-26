const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['driver', 'shipper', 'owner'],
    required: true,
  },
  // Driver-specific fields
  cdlNumber: { type: String, unique: true, sparse: true },
  truckType: { type: String },
  currentLocation: { type: String },
  isAvailable: { type: Boolean, default: true },
  trustScore: { type: Number, default: 4.5, min: 0, max: 5 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },

  // Shipper-specific fields
  companyName: { type: String },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },

  // Owner-specific fields
  fleetSize: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
