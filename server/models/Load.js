const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema({
  shipper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  pickupCity: { type: String, required: true },
  deliveryCity: { type: String, required: true },
  pickupAddress: { type: String },
  deliveryAddress: { type: String },
  pickupDate: { type: Date, required: true },
  estimatedDeliveryDate: { type: Date },
  miles: { type: Number, required: true, min: [1, 'Miles must be a positive number'] },
  ratePerMile: { type: Number, required: true, min: [0.01, 'Rate per mile must be positive'] },
  totalPay: { type: Number, required: true, min: [0, 'Total pay cannot be negative'] },
  weight: { type: Number, required: true, min: [1, 'Weight must be a positive number'] }, // in lbs
  truckType: {
    type: String,
    enum: ['Dry Van', 'Flatbed', 'Refrigerated', 'Tanker', 'Step Deck'],
    required: true,
  },
  commodity: { type: String, required: true },
  specialInstructions: { type: String, default: '' },
  status: {
    type: String,
    enum: ['available', 'accepted', 'in_transit', 'delivered', 'cancelled'],
    default: 'available',
  },
  deliveryConfirmedAt: { type: Date, default: null },
  paymentReleasedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Load', loadSchema);
