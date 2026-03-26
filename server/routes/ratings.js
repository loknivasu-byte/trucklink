const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Load = require('../models/Load');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ratings — Submit a rating after payment is released
router.post('/', protect, async (req, res, next) => {
  try {
    const { loadId, score, comment } = req.body;

    // Validate score
    const scoreInt = parseInt(score, 10);
    if (isNaN(scoreInt) || scoreInt < 1 || scoreInt > 5) {
      return res.status(400).json({ message: 'Score must be a whole number between 1 and 5' });
    }

    // Find the load
    const load = await Load.findById(loadId);
    if (!load) return res.status(404).json({ message: 'Load not found' });
    if (load.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only rate after delivery is confirmed' });
    }

    // Payment must be released before rating
    const payment = await Payment.findOne({ load: loadId });
    if (!payment || payment.status !== 'released') {
      return res.status(400).json({ message: 'Can only rate after payment has been released' });
    }

    // Requester must be the driver or shipper on this load
    const isDriver =
      req.user.role === 'driver' &&
      load.driver?.toString() === req.user._id.toString();
    const isShipper =
      req.user.role === 'shipper' &&
      load.shipper?.toString() === req.user._id.toString();

    if (!isDriver && !isShipper) {
      return res.status(403).json({ message: 'You are not a participant in this load' });
    }

    // Ratee is the other party
    const rateeId = isDriver ? load.shipper : load.driver;
    if (!rateeId) {
      return res.status(400).json({ message: 'No ratee found for this load' });
    }

    // Prevent double-rating
    const existing = await Rating.findOne({ load: loadId, rater: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'You have already rated this load' });
    }

    // Create the rating
    await Rating.create({
      load: loadId,
      rater: req.user._id,
      ratee: rateeId,
      raterRole: req.user.role,
      score: scoreInt,
      comment: comment?.trim() || '',
    });

    // Recompute ratee's average score from all their ratings
    const agg = await Rating.aggregate([
      { $match: { ratee: rateeId } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]);
    const newAvg = agg.length > 0 ? Math.round(agg[0].avg * 10) / 10 : scoreInt;

    // Update the right field: trustScore for drivers, rating for shippers
    const ratee = await User.findById(rateeId);
    if (ratee) {
      const field = ratee.role === 'driver' ? 'trustScore' : 'rating';
      await User.findByIdAndUpdate(rateeId, { [field]: newAvg });
    }

    res.status(201).json({ message: 'Rating submitted', averageScore: newAvg });
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/my — All ratings the current user has submitted
router.get('/my', protect, async (req, res, next) => {
  try {
    const ratings = await Rating.find({ rater: req.user._id })
      .populate('load', '_id pickupCity deliveryCity')
      .populate('ratee', 'name companyName role')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/load/:loadId — Check if current user has rated a specific load
router.get('/load/:loadId', protect, async (req, res, next) => {
  try {
    const rating = await Rating.findOne({
      load: req.params.loadId,
      rater: req.user._id,
    });
    res.json({ rated: !!rating, rating: rating || null });
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/user/:userId — Public ratings received by a user
router.get('/user/:userId', protect, async (req, res, next) => {
  try {
    const ratings = await Rating.find({ ratee: req.params.userId })
      .populate('rater', 'name companyName role')
      .populate('load', 'pickupCity deliveryCity')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
