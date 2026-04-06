const express = require('express');
const router = express.Router();
const Load = require('../models/Load');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/authMiddleware');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/loads - Get all available loads (any authenticated user can browse)
router.get('/', protect, async (req, res, next) => {
  try {
    const { pickupCity, deliveryCity, truckType } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { status: 'available' };

    if (pickupCity) filter.pickupCity = new RegExp(escapeRegex(pickupCity), 'i');
    if (deliveryCity) filter.deliveryCity = new RegExp(escapeRegex(deliveryCity), 'i');
    if (truckType) filter.truckType = truckType;

    const [loads, total] = await Promise.all([
      Load.find(filter)
        .populate('shipper', 'name companyName rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Load.countDocuments(filter),
    ]);

    res.json({ loads, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/loads/my - Shipper sees their own loads
router.get('/my', protect, requireRole('shipper'), async (req, res, next) => {
  try {
    const loads = await Load.find({ shipper: req.user._id })
      .populate('driver', 'name trustScore totalDeliveries')
      .sort({ createdAt: -1 });

    res.json(loads);
  } catch (err) {
    next(err);
  }
});

// GET /api/loads/driver - Driver sees their accepted/active loads
router.get('/driver', protect, requireRole('driver'), async (req, res, next) => {
  try {
    const loads = await Load.find({ driver: req.user._id })
      .populate('shipper', 'name companyName rating')
      .sort({ createdAt: -1 });

    res.json(loads);
  } catch (err) {
    next(err);
  }
});

// GET /api/loads/:id - Single load detail
// Available loads: any authenticated user can view (needed for drivers to preview before accepting)
// Non-available loads: only the shipper or assigned driver can view
router.get('/:id', protect, async (req, res, next) => {
  try {
    const load = await Load.findById(req.params.id)
      .populate('shipper', 'name companyName rating')
      .populate('driver', 'name trustScore totalDeliveries');

    if (!load) {
      return res.status(404).json({ message: 'Load not found' });
    }

    if (load.status !== 'available') {
      const isShipper = load.shipper?._id?.toString() === req.user._id.toString();
      const isDriver = load.driver && load.driver._id.toString() === req.user._id.toString();
      const isOwner = req.user.role === 'owner';
      if (!isShipper && !isDriver && !isOwner) {
        return res.status(403).json({ message: 'Not authorized to view this load' });
      }
    }

    res.json(load);
  } catch (err) {
    next(err);
  }
});

// POST /api/loads - Shipper posts a new load
router.post('/', protect, requireRole('shipper'), async (req, res, next) => {
  try {
    const {
      pickupCity, deliveryCity, pickupAddress, deliveryAddress,
      pickupDate, miles, ratePerMile, weight, truckType, commodity, specialInstructions,
    } = req.body;

    if (!pickupCity || !deliveryCity || !pickupDate || !miles || !ratePerMile || !weight || !truckType || !commodity) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    if (miles <= 0 || ratePerMile <= 0 || weight <= 0) {
      return res.status(400).json({ message: 'Miles, rate per mile, and weight must be positive numbers' });
    }
    // Enforce reasonable upper bounds to prevent data integrity issues
    if (miles > 10000) {
      return res.status(400).json({ message: 'Miles cannot exceed 10,000' });
    }
    if (ratePerMile > 50) {
      return res.status(400).json({ message: 'Rate per mile cannot exceed $50' });
    }
    if (weight > 80000) {
      return res.status(400).json({ message: 'Weight cannot exceed 80,000 lbs (federal limit)' });
    }
    // Pickup date must not be in the past (allow same day)
    const pickupDateObj = new Date(pickupDate);
    if (isNaN(pickupDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid pickup date' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickupDateObj < today) {
      return res.status(400).json({ message: 'Pickup date cannot be in the past' });
    }
    // Trim and cap string fields
    if (commodity.length > 100) {
      return res.status(400).json({ message: 'Commodity must be 100 characters or fewer' });
    }
    if (specialInstructions && specialInstructions.length > 500) {
      return res.status(400).json({ message: 'Special instructions must be 500 characters or fewer' });
    }

    const totalPay = parseFloat((miles * ratePerMile).toFixed(2));
    const estimatedDeliveryDate = new Date(pickupDate);
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + Math.ceil(miles / 500));

    const load = await Load.create({
      shipper: req.user._id,
      pickupCity,
      deliveryCity,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      estimatedDeliveryDate,
      miles,
      ratePerMile,
      totalPay,
      weight,
      truckType,
      commodity,
      specialInstructions,
    });

    // Automatically create an escrow payment record
    try {
      await Payment.create({
        load: load._id,
        shipper: req.user._id,
        amount: totalPay,
        status: 'in_escrow',
        escrowDepositedAt: new Date(),
      });
    } catch (paymentErr) {
      await Load.findByIdAndDelete(load._id);
      return next(paymentErr);
    }

    const populated = await load.populate('shipper', 'name companyName rating');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// PUT /api/loads/:id/accept - Driver accepts a load (atomic to prevent race condition)
router.put('/:id/accept', protect, requireRole('driver'), async (req, res, next) => {
  try {
    // Atomic find-and-update: only succeeds if load is still 'available'
    const load = await Load.findOneAndUpdate(
      { _id: req.params.id, status: 'available' },
      { driver: req.user._id, status: 'accepted' },
      { new: true }
    );

    if (!load) {
      return res.status(404).json({ message: 'Load not found or no longer available' });
    }

    // Link driver to payment record
    const payment = await Payment.findOneAndUpdate(
      { load: load._id },
      { driver: req.user._id },
      { new: true }
    );
    if (!payment) {
      return res.status(500).json({ message: 'Payment record not found for this load' });
    }

    const populated = await load.populate([
      { path: 'shipper', select: 'name companyName rating' },
      { path: 'driver', select: 'name trustScore totalDeliveries' },
    ]);
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// PUT /api/loads/:id/status - Driver moves their load through stages
router.put('/:id/status', protect, requireRole('driver'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: 'Status field is required' });

    const load = await Load.findById(req.params.id);

    if (!load) return res.status(404).json({ message: 'Load not found' });

    // Only the assigned driver can update status
    if (!load.driver || load.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this load' });
    }

    const allowedTransitions = {
      accepted: ['in_transit'],
      in_transit: ['delivered'],
    };

    if (!allowedTransitions[load.status] || !allowedTransitions[load.status].includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${load.status} to ${status}` });
    }

    load.status = status;

    if (status === 'delivered') {
      load.deliveryConfirmedAt = new Date();

      await User.findByIdAndUpdate(req.user._id, { $inc: { totalDeliveries: 1 } });

      // Schedule payment release 2 hours from now
      const releaseTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await Payment.findOneAndUpdate(
        { load: load._id },
        {
          deliveryConfirmedAt: load.deliveryConfirmedAt,
          scheduledReleaseAt: releaseTime,
        }
      );
    }

    await load.save();
    res.json(load);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
