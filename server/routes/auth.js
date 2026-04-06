const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, password, role, companyName, cdlNumber, truckType, currentLocation } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }
    // Prevent self-registration as owner (admin role must be seeded directly)
    if (!['driver', 'shipper'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either driver or shipper' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    // bcrypt silently truncates at 72 bytes — cap here to avoid misleading users
    if (password.length > 72) {
      return res.status(400).json({ message: 'Password must be 72 characters or fewer' });
    }
    if (name.length > 100) {
      return res.status(400).json({ message: 'Name must be 100 characters or fewer' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      companyName: companyName || '',
      cdlNumber: cdlNumber || '',
      truckType: truckType || '',
      currentLocation: currentLocation || '',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      trustScore: user.trustScore,
      totalDeliveries: user.totalDeliveries,
      totalEarnings: user.totalEarnings,
      companyName: user.companyName,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { password, role } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    // Guard against bcrypt DoS via extremely long passwords
    if (password.length > 72) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      trustScore: user.trustScore,
      totalDeliveries: user.totalDeliveries,
      totalEarnings: user.totalEarnings,
      companyName: user.companyName,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
