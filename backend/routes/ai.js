const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

// Rate limiter: 20/hour per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req),
  message: { error: 'AI rate limit exceeded. Try again in an hour.' },
});

// Multer for card scans
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `card_${Date.now()}_${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

async function callOpenRouter(messages) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'TradeShow ROI Optimizer',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter API error');
  return data.choices[0].message.content;
}

function parseAIJson(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) {}
  try {
    const stripped = raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(stripped);
  } catch (_) {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch (_) {} }
  return null;
}

// Truncate array to max N rows before serializing
function truncateRows(rows, max = 50) {
  if (!Array.isArray(rows)) return rows;
  return rows.slice(0, max);
}

async function persistAIResult(userId, endpoint, inputData, result) {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    );
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

// 1. AI ROI Predictor
router.post('/roi-predictor', auth, aiRateLimiter, async (req, res) => {
  try {
    const events = await pool.query('SELECT * FROM events LIMIT 10');
    const expenses = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM expenses');
    const leads = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(estimated_value),0) as value FROM leads');
    const context = `Events: ${JSON.stringify(truncateRows(events.rows, 10))}\nTotal Expenses: $${expenses.rows[0].total}\nLeads: ${leads.rows[0].count} worth $${leads.rows[0].value}`;
    const userInput = req.body.prompt || 'Predict ROI for our upcoming trade shows';

    const raw = await callOpenRouter([
      { role: 'system', content: 'You are a trade show ROI analyst. Return ONLY valid JSON: {"predicted_roi_pct": 0, "break_even_leads": 0, "risk_factors": ["string"], "recommendations": ["string"]}' },
      { role: 'user', content: `${userInput}\n\nData:\n${context}` }
    ]);
    const parsed = parseAIJson(raw);
    await persistAIResult(req.user?.id, 'roi-predictor', { prompt: userInput }, parsed || { result: raw });
    res.json({ result: raw, parsed, type: 'roi-predictor' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. AI Lead Scorer
router.post('/lead-scorer', auth, aiRateLimiter, async (req, res) => {
  try {
    const leads = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 20');
    const userInput = req.body.prompt || 'Score and prioritize all leads';

    const raw = await callOpenRouter([
      { role: 'system', content: 'You are an expert lead scoring analyst. Return ONLY valid JSON: {"scored_leads": [{"id": 0, "score": 0, "intent_level": "hot|warm|cold", "follow_up_priority": "immediate|soon|later"}], "summary": "string"}' },
      { role: 'user', content: `${userInput}\n\nLeads:\n${JSON.stringify(truncateRows(leads.rows, 20))}` }
    ]);
    const parsed = parseAIJson(raw);
    await persistAIResult(req.user?.id, 'lead-scorer', { prompt: userInput }, parsed || { result: raw });
    res.json({ result: raw, parsed, type: 'lead-scorer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. AI Budget Optimizer
router.post('/budget-optimizer', auth, aiRateLimiter, async (req, res) => {
  try {
    const budgets = await pool.query('SELECT * FROM budgets ORDER BY created_at DESC LIMIT 50');
    const expenses = await pool.query('SELECT category, SUM(amount) as total FROM expenses GROUP BY category');
    const userInput = req.body.prompt || 'Optimize our trade show budget allocation';

    const raw = await callOpenRouter([
      { role: 'system', content: 'You are a budget optimization expert. Return ONLY valid JSON: {"savings_opportunities": [{"category": "string", "current_spend": 0, "recommended_spend": 0, "rationale": "string"}], "total_savings": 0, "summary": "string"}' },
      { role: 'user', content: `${userInput}\n\nBudgets:\n${JSON.stringify(truncateRows(budgets.rows))}\n\nExpenses:\n${JSON.stringify(expenses.rows)}` }
    ]);
    const parsed = parseAIJson(raw);
    await persistAIResult(req.user?.id, 'budget-optimizer', { prompt: userInput }, parsed || { result: raw });
    res.json({ result: raw, parsed, type: 'budget-optimizer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. AI Competitor Analyzer
router.post('/competitor-analyzer', auth, aiRateLimiter, async (req, res) => {
  try {
    const competitors = await pool.query('SELECT * FROM competitors ORDER BY created_at DESC LIMIT 50');
    const userInput = req.body.prompt || 'Analyze our competitors and suggest counter-strategies';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a competitive intelligence analyst specializing in trade shows. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nCompetitor Data:\n${JSON.stringify(truncateRows(competitors.rows))}` }
    ]);
    await persistAIResult(req.user?.id, 'competitor-analyzer', {}, { result });
    res.json({ result, type: 'competitor-analyzer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. AI Follow-up Email Generator
router.post('/followup-generator', auth, aiRateLimiter, async (req, res) => {
  try {
    const followups = await pool.query("SELECT * FROM followups WHERE status != 'completed' ORDER BY due_date ASC LIMIT 10");
    const userInput = req.body.prompt || 'Generate personalized follow-up emails for pending contacts';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are an expert at writing trade show follow-up communications. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nPending Follow-ups:\n${JSON.stringify(truncateRows(followups.rows))}` }
    ]);
    await persistAIResult(req.user?.id, 'followup-generator', {}, { result });
    res.json({ result, type: 'followup-generator' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. AI Event Recommender
router.post('/event-recommender', auth, aiRateLimiter, async (req, res) => {
  try {
    const events = await pool.query('SELECT * FROM events ORDER BY start_date DESC LIMIT 20');
    const leads = await pool.query('SELECT event_id, COUNT(*) as lead_count, SUM(estimated_value) as total_value FROM leads GROUP BY event_id');
    const userInput = req.body.prompt || 'Recommend which events we should attend next year';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show strategy consultant. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nPast Events:\n${JSON.stringify(truncateRows(events.rows))}\n\nLead Performance:\n${JSON.stringify(leads.rows)}` }
    ]);
    await persistAIResult(req.user?.id, 'event-recommender', {}, { result });
    res.json({ result, type: 'event-recommender' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. AI Booth Design Advisor
router.post('/booth-advisor', auth, aiRateLimiter, async (req, res) => {
  try {
    const booths = await pool.query('SELECT * FROM booths ORDER BY created_at DESC LIMIT 20');
    const leads = await pool.query('SELECT b.booth_number, COUNT(l.id) as leads FROM booths b LEFT JOIN leads l ON b.event_id = l.event_id GROUP BY b.booth_number LIMIT 20');
    const userInput = req.body.prompt || 'Advise on booth design and placement strategy';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show booth design and placement expert. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nBooth Data:\n${JSON.stringify(truncateRows(booths.rows))}\n\nLeads by Booth:\n${JSON.stringify(leads.rows)}` }
    ]);
    await persistAIResult(req.user?.id, 'booth-advisor', {}, { result });
    res.json({ result, type: 'booth-advisor' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. AI Marketing Copy Generator
router.post('/marketing-copy', auth, aiRateLimiter, async (req, res) => {
  try {
    const materials = await pool.query('SELECT * FROM materials ORDER BY created_at DESC LIMIT 10');
    const events = await pool.query("SELECT * FROM events WHERE status = 'upcoming' LIMIT 5");
    const userInput = req.body.prompt || 'Generate marketing copy for our upcoming trade show materials';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a marketing copywriter specializing in trade show materials. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nMaterials:\n${JSON.stringify(truncateRows(materials.rows))}\n\nUpcoming Events:\n${JSON.stringify(truncateRows(events.rows))}` }
    ]);
    await persistAIResult(req.user?.id, 'marketing-copy', {}, { result });
    res.json({ result, type: 'marketing-copy' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. AI Staff Optimizer
router.post('/staff-optimizer', auth, aiRateLimiter, async (req, res) => {
  try {
    const staff = await pool.query('SELECT * FROM staff ORDER BY created_at DESC LIMIT 50');
    const events = await pool.query("SELECT * FROM events WHERE status = 'upcoming' LIMIT 10");
    const userInput = req.body.prompt || 'Optimize staff allocation across upcoming events';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show staffing expert. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nStaff:\n${JSON.stringify(truncateRows(staff.rows))}\n\nEvents:\n${JSON.stringify(truncateRows(events.rows))}` }
    ]);
    await persistAIResult(req.user?.id, 'staff-optimizer', {}, { result });
    res.json({ result, type: 'staff-optimizer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. AI Performance Reporter
router.post('/performance-reporter', auth, aiRateLimiter, async (req, res) => {
  try {
    const [events, leads, expenses, sponsors] = await Promise.all([
      pool.query('SELECT * FROM events LIMIT 50'),
      pool.query('SELECT event_id, COUNT(*) as count, SUM(estimated_value) as value FROM leads GROUP BY event_id LIMIT 20'),
      pool.query('SELECT category, SUM(amount) as total FROM expenses GROUP BY category'),
      pool.query('SELECT COUNT(*) as count, SUM(amount) as total FROM sponsors'),
    ]);
    const userInput = req.body.prompt || 'Generate a comprehensive performance report';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show performance analyst. Use markdown with headers.' },
      { role: 'user', content: `${userInput}\n\nEvents: ${JSON.stringify(truncateRows(events.rows))}\nLeads: ${JSON.stringify(leads.rows)}\nExpenses: ${JSON.stringify(expenses.rows)}\nSponsors: ${JSON.stringify(sponsors.rows)}` }
    ]);
    await persistAIResult(req.user?.id, 'performance-reporter', {}, { result });
    res.json({ result, type: 'performance-reporter' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 11. AI Sponsorship Advisor
router.post('/sponsorship-advisor', auth, aiRateLimiter, async (req, res) => {
  try {
    const sponsors = await pool.query('SELECT * FROM sponsors ORDER BY amount DESC LIMIT 50');
    const events = await pool.query('SELECT * FROM events LIMIT 20');
    const userInput = req.body.prompt || 'Advise on sponsorship strategy and pricing';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a sponsorship strategy consultant for trade shows. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nSponsors:\n${JSON.stringify(truncateRows(sponsors.rows))}\n\nEvents:\n${JSON.stringify(truncateRows(events.rows))}` }
    ]);
    await persistAIResult(req.user?.id, 'sponsorship-advisor', {}, { result });
    res.json({ result, type: 'sponsorship-advisor' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 12. AI Networking Strategy
router.post('/networking-strategy', auth, aiRateLimiter, async (req, res) => {
  try {
    const leads = await pool.query('SELECT * FROM leads ORDER BY estimated_value DESC LIMIT 15');
    const events = await pool.query("SELECT * FROM events WHERE status = 'upcoming' LIMIT 10");
    const userInput = req.body.prompt || 'Create a networking strategy for upcoming events';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a professional networking strategist for trade shows. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nHigh-Value Leads:\n${JSON.stringify(truncateRows(leads.rows, 15))}\n\nEvents:\n${JSON.stringify(truncateRows(events.rows))}` }
    ]);
    await persistAIResult(req.user?.id, 'networking-strategy', {}, { result });
    res.json({ result, type: 'networking-strategy' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// NEW: Business Card OCR Lead Capture
router.post('/scan-card', auth, aiRateLimiter, upload.single('card'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Card image required' });

    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'TradeShow ROI Optimizer',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            { type: 'text', text: 'Extract all contact information from this business card. Return ONLY valid JSON: {"name": "string", "email": "string", "phone": "string", "title": "string", "company": "string", "website": "string", "address": "string"}' }
          ]
        }]
      })
    });

    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(raw);

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    // Auto-create lead record
    let lead = null;
    if (parsed?.name || parsed?.email) {
      const eventId = req.body.event_id || null;
      const r = await pool.query(
        `INSERT INTO leads (event_id, contact_name, company, email, phone, job_title, source, interest_level, status)
         VALUES ($1,$2,$3,$4,$5,$6,'card_scan','medium','new') RETURNING *`,
        [eventId, parsed.name || 'Unknown', parsed.company || '', parsed.email || '', parsed.phone || '', parsed.title || '']
      ).catch(() => ({ rows: [] }));
      lead = r.rows[0];
    }

    await persistAIResult(req.user?.id, 'scan-card', { filename: req.file.originalname }, parsed || {});
    res.json({ extracted: parsed || { raw }, lead });
  } catch (err) {
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    res.status(500).json({ error: err.message });
  }
});

// NEW: AI Follow-up Sequence Generator
router.post('/followup-sequence', auth, aiRateLimiter, async (req, res) => {
  try {
    const followups = await pool.query("SELECT f.*, l.contact_name, l.company, l.email, l.estimated_value FROM followups f LEFT JOIN leads l ON f.contact_name = l.contact_name WHERE f.status = 'pending' LIMIT 20");
    const userInput = req.body.prompt || 'Generate personalized email follow-up sequences for all pending contacts';

    const raw = await callOpenRouter([
      { role: 'system', content: 'You are an expert at B2B trade show follow-up sequences. Return ONLY valid JSON: {"sequences": [{"contact_name": "string", "company": "string", "touches": [{"day": 1, "subject": "string", "body": "string"}]}], "strategy": "string"}' },
      { role: 'user', content: `${userInput}\n\nPending Follow-ups:\n${JSON.stringify(truncateRows(followups.rows))}` }
    ]);
    const parsed = parseAIJson(raw);

    // Save sequences to followups table
    if (parsed?.sequences?.length) {
      const now = new Date();
      for (const seq of parsed.sequences.slice(0, 10)) {
        for (const touch of (seq.touches || [])) {
          const scheduledAt = new Date(now.getTime() + (touch.day || 1) * 24 * 60 * 60 * 1000);
          await pool.query(
            `INSERT INTO followups (contact_name, company, followup_type, notes, status, due_date)
             VALUES ($1,$2,'ai-sequence',$3,'pending',$4) ON CONFLICT DO NOTHING`,
            [seq.contact_name, seq.company, `Day ${touch.day}: ${touch.subject}`, scheduledAt]
          ).catch(() => {});
        }
      }
    }

    await persistAIResult(req.user?.id, 'followup-sequence', {}, parsed || { result: raw });
    res.json({ result: raw, parsed, type: 'followup-sequence' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// NEW: Event Briefing Pack Generator
router.post('/event-briefing/:id', auth, aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const [competitors, budgets, materials, staff] = await Promise.all([
      pool.query('SELECT * FROM competitors LIMIT 10'),
      pool.query('SELECT * FROM budgets WHERE event_id = $1 LIMIT 5', [id]).catch(() => pool.query('SELECT * FROM budgets LIMIT 5')),
      pool.query('SELECT * FROM materials WHERE event_id = $1 LIMIT 10', [id]).catch(() => pool.query('SELECT * FROM materials LIMIT 10')),
      pool.query('SELECT * FROM staff LIMIT 20'),
    ]);

    const raw = await callOpenRouter([
      { role: 'system', content: 'You are a trade show event strategy expert. Return ONLY valid JSON: {"target_attendees": "string", "competitor_summary": "string", "talking_points": ["string"], "daily_schedule": ["string"], "budget_guardrails": "string", "success_metrics": ["string"]}' },
      { role: 'user', content: `Generate an event briefing pack for:\nEvent: ${JSON.stringify(event.rows[0])}\nCompetitors: ${JSON.stringify(truncateRows(competitors.rows))}\nBudget: ${JSON.stringify(truncateRows(budgets.rows))}\nMaterials: ${JSON.stringify(truncateRows(materials.rows))}\nStaff: ${JSON.stringify(truncateRows(staff.rows))}` }
    ]);
    const parsed = parseAIJson(raw);

    // Save briefing to new briefings table
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS event_briefings (id SERIAL PRIMARY KEY, event_id INTEGER, briefing JSONB, created_at TIMESTAMP DEFAULT NOW())`);
      await pool.query('INSERT INTO event_briefings (event_id, briefing) VALUES ($1,$2)', [id, JSON.stringify(parsed || { raw })]);
    } catch (_) {}

    await persistAIResult(req.user?.id, 'event-briefing', { event_id: id }, parsed || { result: raw });
    res.json({ result: raw, parsed, type: 'event-briefing', event: event.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// NEW: Floor Heatmap Data
router.post('/lead-heatmap/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        booth_id,
        COUNT(*) as count
      FROM leads
      WHERE event_id = $1 AND created_at IS NOT NULL
      GROUP BY hour, booth_id
      ORDER BY hour, booth_id
    `, [id]);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const boothSet = new Set(leads.rows.map(r => r.booth_id).filter(Boolean));
    const booths = [...boothSet];

    const matrix = hours.map(hour => {
      return booths.map(booth => {
        const row = leads.rows.find(r => parseInt(r.hour) === hour && r.booth_id === booth);
        return parseInt(row?.count || 0);
      });
    });

    res.json({ hours, booths, heatmap_matrix: matrix, raw_data: leads.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 17. AI Post-Event Sentiment Analysis
router.post('/post-event-sentiment', auth, aiRateLimiter, async (req, res) => {
  try {
    const { event_id, survey_responses, social_mentions } = req.body;
    let event = null;
    if (event_id) {
      const r = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]).catch(() => ({ rows: [] }));
      event = r.rows[0] || null;
    }
    let leads = [];
    if (event_id) {
      const r = await pool.query('SELECT * FROM leads WHERE event_id = $1 ORDER BY created_at DESC LIMIT 100', [event_id]).catch(() => ({ rows: [] }));
      leads = r.rows;
    }

    const messages = [
      { role: 'system', content: 'You are a post-event sentiment analyst for B2B events. Always respond with valid JSON only.' },
      { role: 'user', content: `Analyze post-event attendee sentiment.
Event: ${JSON.stringify(event || {})}
Survey responses: ${JSON.stringify(truncateRows(survey_responses || [], 50))}
Social mentions: ${JSON.stringify(truncateRows(social_mentions || [], 30))}
Leads context: ${JSON.stringify(truncateRows(leads, 30))}

Return JSON:
{
  "overall_sentiment": "positive|neutral|negative|mixed",
  "sentiment_score": <-1.0..1.0>,
  "themes": [{"theme": "...", "sentiment": "...", "mentions": <number>, "sample_quote": "..."}],
  "close_probability_uplift": "<estimate>",
  "high_value_leads": [<lead_id>],
  "follow_up_priority": ["..."],
  "summary": "..."
}`}
    ];
    const raw = await callOpenRouter(messages);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'post-event-sentiment', { event_id }, result);
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 18. AI Account-Based Marketing Targeting
router.post('/abm-targeting', auth, aiRateLimiter, async (req, res) => {
  try {
    const { event_id, target_industries, deal_size_min_usd } = req.body;
    let leads = [];
    if (event_id) {
      const r = await pool.query('SELECT * FROM leads WHERE event_id = $1 ORDER BY created_at DESC LIMIT 200', [event_id]).catch(() => ({ rows: [] }));
      leads = r.rows;
    }

    const messages = [
      { role: 'system', content: 'You are an account-based marketing strategist. Always respond with valid JSON only.' },
      { role: 'user', content: `Identify high-value company attendees and recommend personalized outreach.
Target industries: ${JSON.stringify(target_industries || [])}
Min deal size: ${deal_size_min_usd || 'unspecified'}
Leads: ${JSON.stringify(truncateRows(leads, 60))}

Return JSON:
{
  "priority_accounts": [{"company_name": "...", "lead_ids": [<id>], "fit_score": <0-100>, "intent_signals": ["..."], "recommended_outreach_sequence": [{"day": <number>, "channel": "...", "message_outline": "..."}]}],
  "tier_1_count": <number>,
  "tier_2_count": <number>,
  "estimated_pipeline_usd": <number>,
  "summary": "..."
}`}
    ];
    const raw = await callOpenRouter(messages);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'abm-targeting', { event_id, target_industries }, result);
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 19. AI Competitor Win/Loss Analysis
router.post('/competitor-winloss', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. OPENROUTER_API_KEY missing.' });
    }
    const { event_id, deals_won, deals_lost, narrative } = req.body || {};
    let competitors = [];
    let leads = [];
    try {
      const c = await pool.query('SELECT * FROM competitors ORDER BY id DESC LIMIT 100');
      competitors = c.rows;
    } catch (_) {}
    if (event_id) {
      try {
        const r = await pool.query('SELECT * FROM leads WHERE event_id = $1 ORDER BY created_at DESC LIMIT 200', [event_id]);
        leads = r.rows;
      } catch (_) {}
    }

    const messages = [
      { role: 'system', content: 'You are a B2B competitive intelligence analyst. Always respond with valid JSON only.' },
      { role: 'user', content: `Conduct a competitor win/loss analysis for trade show pipeline.
Competitors: ${JSON.stringify(truncateRows(competitors, 30))}
Deals won: ${JSON.stringify(truncateRows(deals_won || [], 30))}
Deals lost: ${JSON.stringify(truncateRows(deals_lost || [], 30))}
Leads context: ${JSON.stringify(truncateRows(leads, 30))}
Narrative input: ${narrative || 'none'}

Return JSON:
{
  "win_themes": [{"theme": "...", "frequency": <number>, "evidence": ["..."]}],
  "loss_themes": [{"theme": "...", "frequency": <number>, "evidence": ["..."]}],
  "competitor_breakdown": [{"competitor": "...", "wins_against": <number>, "losses_to": <number>, "key_differentiators": ["..."]}],
  "recommended_battle_cards": [{"competitor": "...", "objections": ["..."], "responses": ["..."]}],
  "process_improvements": ["..."],
  "summary": "..."
}` }
    ];
    const raw = await callOpenRouter(messages);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'competitor-winloss', { event_id, deals_won_count: (deals_won || []).length, deals_lost_count: (deals_lost || []).length }, result);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 20. AI Multi-Event Portfolio Optimization
router.post('/portfolio-optimizer', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. OPENROUTER_API_KEY missing.' });
    }
    const { fiscal_year, total_budget_usd, strategic_goals } = req.body || {};

    let events = [];
    let leadsAgg = [];
    let expensesAgg = [];
    try {
      const e = await pool.query('SELECT * FROM events ORDER BY id DESC LIMIT 100');
      events = e.rows;
    } catch (_) {}
    try {
      const l = await pool.query("SELECT event_id, COUNT(*)::int AS lead_count, COALESCE(SUM(estimated_value),0)::int AS lead_value FROM leads GROUP BY event_id");
      leadsAgg = l.rows;
    } catch (_) {}
    try {
      const x = await pool.query("SELECT event_id, COALESCE(SUM(amount),0)::int AS total_spend FROM expenses GROUP BY event_id");
      expensesAgg = x.rows;
    } catch (_) {}

    const messages = [
      { role: 'system', content: 'You are a portfolio strategist for multi-event trade show programs. Always respond with valid JSON only.' },
      { role: 'user', content: `Optimize the multi-event portfolio for the fiscal year.
Fiscal year: ${fiscal_year || 'next 12 months'}
Total budget USD: ${total_budget_usd || 'unspecified'}
Strategic goals: ${JSON.stringify(strategic_goals || [])}
Past events: ${JSON.stringify(truncateRows(events, 40))}
Leads aggregated by event: ${JSON.stringify(truncateRows(leadsAgg, 40))}
Expenses aggregated by event: ${JSON.stringify(truncateRows(expensesAgg, 40))}

Return JSON:
{
  "recommended_portfolio": [{"event_name": "...", "rationale": "...", "tier": "tier-1|tier-2|tier-3", "recommended_spend_usd": <number>, "expected_pipeline_usd": <number>}],
  "drop_list": [{"event_name": "...", "reason": "..."}],
  "new_event_candidates": [{"event_name": "...", "reason": "..."}],
  "total_recommended_spend_usd": <number>,
  "portfolio_expected_pipeline_usd": <number>,
  "risk_flags": ["..."],
  "summary": "..."
}` }
    ];
    const raw = await callOpenRouter(messages);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'portfolio-optimizer', { fiscal_year, total_budget_usd }, result);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Apply pass 5 additions -----

// POST /api/ai/crm-sync
// NEEDS-CREDS: Salesforce or HubSpot API credentials.
// ENV VARS: SALESFORCE_ACCESS_TOKEN, SALESFORCE_INSTANCE_URL  OR  HUBSPOT_API_KEY
// Returns 503 + { missing } if neither provider is configured.
router.post('/crm-sync', auth, aiRateLimiter, async (req, res) => {
  const hasSalesforce = !!(process.env.SALESFORCE_ACCESS_TOKEN && process.env.SALESFORCE_INSTANCE_URL);
  const hasHubspot = !!process.env.HUBSPOT_API_KEY;
  if (!hasSalesforce && !hasHubspot) {
    return res.status(503).json({
      error: 'CRM provider not configured',
      missing: 'SALESFORCE_ACCESS_TOKEN+SALESFORCE_INSTANCE_URL or HUBSPOT_API_KEY',
    });
  }
  // PRODUCT-DECISION: even when keys are present we return a synced count from
  // local lead rows; the live SDK push to the chosen CRM is intentionally
  // stubbed (no SDK install allowed). This wires the FE for real-world use.
  try {
    const eventId = Number(req.body?.event_id) || null;
    const provider = hasSalesforce ? 'salesforce' : 'hubspot';
    const leadsRes = eventId
      ? await pool.query('SELECT id, name, email, company FROM leads WHERE event_id = $1 LIMIT 200', [eventId])
      : await pool.query('SELECT id, name, email, company FROM leads LIMIT 200');
    res.json({
      provider,
      event_id: eventId,
      synced_count: leadsRes.rows.length,
      note: 'Provider stubbed — credentials configured but SDK push not yet wired.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/email-campaign-send
// NEEDS-CREDS: ESP credentials (Mailchimp / SendGrid).
// ENV VARS: MAILCHIMP_API_KEY  OR  SENDGRID_API_KEY
router.post('/email-campaign-send', auth, aiRateLimiter, async (req, res) => {
  const has = !!(process.env.MAILCHIMP_API_KEY || process.env.SENDGRID_API_KEY);
  if (!has) {
    return res.status(503).json({
      error: 'Email service provider not configured',
      missing: 'MAILCHIMP_API_KEY or SENDGRID_API_KEY',
    });
  }
  // PRODUCT-DECISION: stubbed — provider SDK push not wired.
  res.json({
    provider: process.env.MAILCHIMP_API_KEY ? 'mailchimp' : 'sendgrid',
    queued: Array.isArray(req.body?.recipients) ? req.body.recipients.length : 0,
    note: 'Email send stubbed — credentials configured but provider call not yet wired.',
  });
});

// POST /api/ai/badge-track
// NEEDS-CREDS: Badge tracking platform (Cvent / Bizzabo / Stova).
// ENV VARS: BADGE_TRACKING_API_KEY, BADGE_TRACKING_API_URL
router.post('/badge-track', auth, aiRateLimiter, async (req, res) => {
  const required = ['BADGE_TRACKING_API_KEY', 'BADGE_TRACKING_API_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return res.status(503).json({ error: 'Badge tracking not configured', missing: missing.join(',') });
  }
  // PRODUCT-DECISION: stubbed — return empty positions array.
  res.json({
    event_id: req.body?.event_id || null,
    positions: [],
    note: 'Badge tracking stubbed — credentials configured but live API not yet wired.',
  });
});

// POST /api/ai/post-event-survey-automation
// MECHANICAL: AI generates a tailored post-event survey.
router.post('/post-event-survey-automation', auth, aiRateLimiter, async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service not configured', missing: 'OPENROUTER_API_KEY' });
  }
  try {
    const { event_id, audience, focus_areas } = req.body || {};
    let eventRow = null;
    if (event_id) {
      try {
        const r = await pool.query('SELECT * FROM events WHERE id = $1', [Number(event_id)]);
        eventRow = r.rows[0] || null;
      } catch (_) {}
    }
    const messages = [
      { role: 'system', content: 'You are a survey designer. Return ONLY valid JSON: {"survey_title":"string","intro":"string","questions":[{"id":"string","prompt":"string","type":"single|multi|likert|open","options":["string"],"required":boolean}],"estimated_completion_minutes":number,"distribution_recommendations":["string"]}' },
      { role: 'user', content: `Audience: ${audience || 'attendees'}\nFocus: ${focus_areas || 'overall satisfaction, content, networking, ROI'}\nEvent: ${eventRow ? JSON.stringify(eventRow) : 'unspecified'}` },
    ];
    const raw = await callOpenRouter(messages);
    const parsed = parseAIJson(raw) || { raw };
    await persistAIResult(req.user?.id, 'post-event-survey-automation', { event_id, audience }, parsed);
    res.json({ result: parsed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
