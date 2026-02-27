const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Free vision model: VL = vision-language, supports image_url input
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';

const SYSTEM_PROMPT = `You are Punch — a tiny, curious, mischievous baby monkey who is looking for the perfect human parent. You evaluate humans based purely on what matters to a baby monkey:
- Warmth & snuggliness (do they look soft and cozy to cling to?)
- Playful energy (do they look fun and silly?)
- Trustworthiness (do they look like they'd protect you from predators?)
- Banana-holding capability (do they have good hands for holding fruit?)
- Lap quality (do they look like a good napping spot?)
- General "monkey vibe" (are they the kind of human a monkey would feel at home with?)

NEVER assign negative traits. Only positive or neutral monkey-parent qualities. Frame everything from a baby monkey's delightful perspective.

You respond ONLY with valid JSON in this exact format, no other text:
{
  "score": <number 1-100>,
  "verdict": "<5-8 word punchy verdict title>",
  "traits": [
    {"emoji": "🍌", "label": "trait name"},
    {"emoji": "🌿", "label": "trait name"},
    {"emoji": "🐒", "label": "trait name"}
  ],
  "analysis": "<2-3 sentence analysis from Punch's perspective, warm and fun, referring to yourself as Punch>",
  "punch_quote": "<A short, endearing 1-sentence quote from Punch about this potential parent>"
}`;

function parseResult(rawText) {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not find JSON in response');
  const result = JSON.parse(jsonMatch[0]);
  if (typeof result.score !== 'number') result.score = 50;
  result.score = Math.max(1, Math.min(100, Math.round(result.score)));
  if (!result.verdict) result.verdict = 'Punch is still thinking!';
  if (!result.analysis) result.analysis = 'Punch thinks you have potential.';
  if (!result.punch_quote) result.punch_quote = 'You seem nice!';
  if (!Array.isArray(result.traits)) result.traits = [];
  return result;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OpenRouter API key not configured',
      code: 'NO_API_KEY',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const image = body && body.image;
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "image" (data URL)' });
  }

  const imageUrl = image.indexOf('data:') === 0 ? image : `data:image/jpeg;base64,${image}`;

  const payload = {
    model: MODEL,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please evaluate this human as a potential parent for me, baby monkey Punch. Be warm, fun, and encouraging! Reply with only the JSON object.',
          },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
  };

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const status = response.status;
      const message = data.error?.message || data.error || JSON.stringify(data);
      return res.status(status >= 400 && status < 600 ? status : 502).json({
        error: 'OpenRouter request failed',
        details: message,
      });
    }

    const rawText =
      data.choices?.[0]?.message?.content ?? '';
    if (!rawText) {
      return res.status(502).json({ error: 'Empty response from model' });
    }

    const result = parseResult(rawText);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Evaluate error:', err);
    return res.status(500).json({
      error: 'Punch dropped the banana — something went wrong.',
      code: 'SERVER_ERROR',
    });
  }
}
