const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Rating = require('../models/Rating');
const { protect } = require('../middleware/authMiddleware');

// GET /api/users/:id — Public profile for any user
// Returns limited public fields only — no password, no email
router.get('/:id', protect, async (req, res, next) => {
  try {
    // totalEarnings is private financial data — excluded from public profiles
    const user = await User.findById(req.params.id).select(
      'name companyName role trustScore rating totalDeliveries createdAt'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ratingsReceived = await Rating.find({ ratee: req.params.id })
      .populate('rater', 'name companyName role')
      .populate('load', 'pickupCity deliveryCity')
      .sort({ createdAt: -1 });

    res.json({ user, ratingsReceived });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
