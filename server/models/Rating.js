const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    load: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Load',
      required: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    raterRole: {
      type: String,
      enum: ['driver', 'shipper'],
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: [1, 'Score must be at least 1'],
      max: [5, 'Score cannot exceed 5'],
    },
    comment: {
      type: String,
      default: '',
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent rating the same load twice from the same rater
ratingSchema.index({ load: 1, rater: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
