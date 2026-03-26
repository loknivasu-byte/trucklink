const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    load: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Load',
      required: true,
    },
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
    amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
    status: {
      type: String,
      enum: ['pending', 'in_escrow', 'released', 'refunded'],
      default: 'pending',
    },
    escrowDepositedAt: { type: Date, default: null },
    // When delivery is confirmed, payment releases within 2 hours
    deliveryConfirmedAt: { type: Date, default: null },
    scheduledReleaseAt: { type: Date, default: null }, // +2 hours from confirmation
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

module.exports = mongoose.model('Payment', paymentSchema);
