const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/chat - Proxy to Claude API (implemented in Step 7)
router.post('/chat', protect, async (req, res) => {
  res.json({
    message: 'AI assistant will be connected in Step 7. Placeholder response: Hello! I am the TruckLink AI assistant. I will help you with loads, payments, and route questions once fully connected.',
  });
});

module.exports = router;
