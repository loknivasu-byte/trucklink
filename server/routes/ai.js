const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { protect } = require('../middleware/authMiddleware');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// POST /api/ai/chat — AI load matching via Claude
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { message, loads = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      return res.status(503).json({ message: 'AI service is not configured. Add your CLAUDE_API_KEY to server/.env to enable this feature.' });
    }

    // Slim down load objects so Claude's context stays small
    const loadsSummary = loads.map((l) => ({
      id: l._id,
      route: `${l.pickupCity} → ${l.deliveryCity}`,
      truckType: l.truckType,
      miles: l.miles,
      totalPay: l.totalPay,
      ratePerMile: l.ratePerMile,
      weight: l.weight,
      commodity: l.commodity,
      pickupDate: l.pickupDate
        ? new Date(l.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null,
      shipper: l.shipper?.companyName || l.shipper?.name || null,
    }));

    const systemPrompt = `You are TruckLink AI, an intelligent load matching assistant for truck drivers in the US freight industry. Your job is to help drivers find the best available loads based on their preferences, location, truck type, and earning goals.

Available loads (${loadsSummary.length} total):
${JSON.stringify(loadsSummary, null, 2)}

Instructions:
- Recommend the 1–3 best loads from the list above that match the driver's request
- Be concise: 2–4 sentences of reasoning max
- Mention specific load details (route, pay, truck type) to justify each recommendation
- If nothing matches well, say so honestly and suggest what filters to adjust
- At the very end of your response, on its own line, output exactly:
RECOMMENDED_IDS: ["id1","id2"]
Replace id1/id2 with the actual id values from the loads above. Output an empty array if no loads match.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 450,
      system: systemPrompt,
      messages: [{ role: 'user', content: message.trim() }],
    });

    const fullText = response.content[0]?.text ?? '';

    // Extract the RECOMMENDED_IDS line and parse it
    const idMatch = fullText.match(/RECOMMENDED_IDS:\s*(\[.*?\])/);
    let recommendedIds = [];
    if (idMatch) {
      try {
        recommendedIds = JSON.parse(idMatch[1]);
      } catch {
        recommendedIds = [];
      }
    }

    // Strip the RECOMMENDED_IDS marker from the text shown to the driver
    const displayText = fullText.replace(/RECOMMENDED_IDS:.*$/m, '').trim();

    res.json({ text: displayText, recommendedIds });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
