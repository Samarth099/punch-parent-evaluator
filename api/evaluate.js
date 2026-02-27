const fs = require('fs');
const path = require('path');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Free vision model: VL = vision-language, supports image_url input
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';

// Load scoring guideline from scoring.md (master prompt for every evaluation)
let cachedScoringPrompt = null;
function getScoringPrompt() {
  if (cachedScoringPrompt) return cachedScoringPrompt;
  try {
    const scoringPath = path.join(__dirname, '..', 'scoring.md');
    cachedScoringPrompt = fs.readFileSync(scoringPath, 'utf8');
  } catch (_) {
    // Fallback if file missing (e.g. wrong cwd)
    cachedScoringPrompt = `You are Punch — a baby monkey evaluating a potential human parent. Score 1-100. Reply with only valid JSON: {"score":<1-100>,"verdict":"<5-8 words>","traits":[{"emoji":"🍌","label":"trait"}],"analysis":"<2-3 sentences>","punch_quote":"<one sentence>"}. Never assign negative traits.`;
  }
  return cachedScoringPrompt;
}

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

  const systemPrompt = getScoringPrompt();
  const payload = {
    model: MODEL,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
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
