const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Load = require('../models/Load');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/authMiddleware');

// GET /api/payments/my - Get payments for current user (shipper or driver)
router.get('/my', protect, async (req, res, next) => {
  try {
    const filter = req.user.role === 'shipper'
      ? { shipper: req.user._id }
      : { driver: req.user._id };

    const payments = await Payment.find(filter)
      .populate('load', 'pickupCity deliveryCity miles totalPay status')
      .populate('shipper', 'name companyName')
      .populate('driver', 'name')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/release/:loadId - Manually trigger payment release (for demo)
router.post('/release/:loadId', protect, requireRole('shipper'), async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ load: req.params.loadId, shipper: req.user._id });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'released') return res.status(400).json({ message: 'Payment already released' });

    payment.status = 'released';
    payment.releasedAt = new Date();
    await payment.save();

    // Update driver total earnings
    if (payment.driver) {
      await User.findByIdAndUpdate(payment.driver, {
        $inc: { totalEarnings: payment.amount },
      });
    }

    // Update load payment released timestamp
    await Load.findByIdAndUpdate(req.params.loadId, {
      paymentReleasedAt: payment.releasedAt,
    });

    res.json(payment);
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/status/:loadId - Check escrow status for a load
router.get('/status/:loadId', protect, async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ load: req.params.loadId })
      .populate('load', 'pickupCity deliveryCity status deliveryConfirmedAt');

    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Calculate time remaining until auto-release
    let minutesUntilRelease = null;
    if (payment.scheduledReleaseAt && payment.status !== 'released') {
      const diff = new Date(payment.scheduledReleaseAt) - new Date();
      minutesUntilRelease = Math.max(0, Math.ceil(diff / 60000));
    }

    res.json({ ...payment.toObject(), minutesUntilRelease });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
