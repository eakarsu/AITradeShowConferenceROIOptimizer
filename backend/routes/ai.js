const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

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
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter API error');
  return data.choices[0].message.content;
}

// 1. AI ROI Predictor
router.post('/roi-predictor', auth, async (req, res) => {
  try {
    const events = await pool.query('SELECT * FROM events LIMIT 10');
    const expenses = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM expenses');
    const leads = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(estimated_value),0) as value FROM leads');
    const context = `Events: ${JSON.stringify(events.rows)}\nTotal Expenses: $${expenses.rows[0].total}\nLeads: ${leads.rows[0].count} worth $${leads.rows[0].value}`;
    const userInput = req.body.prompt || 'Predict ROI for our upcoming trade shows';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are an expert trade show ROI analyst. Analyze the data and provide detailed ROI predictions with specific percentages, dollar amounts, and actionable recommendations. Format your response with clear sections using markdown headers.' },
      { role: 'user', content: `${userInput}\n\nCurrent Data:\n${context}` }
    ]);
    res.json({ result, type: 'roi-predictor' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. AI Lead Scorer
router.post('/lead-scorer', auth, async (req, res) => {
  try {
    const leads = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 20');
    const userInput = req.body.prompt || 'Score and prioritize all leads';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are an expert lead scoring analyst for trade shows. Score each lead from 1-100 based on their potential value, interest level, and company profile. Provide prioritized recommendations. Use markdown formatting with tables where appropriate.' },
      { role: 'user', content: `${userInput}\n\nLeads Data:\n${JSON.stringify(leads.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'lead-scorer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. AI Budget Optimizer
router.post('/budget-optimizer', auth, async (req, res) => {
  try {
    const budgets = await pool.query('SELECT * FROM budgets ORDER BY created_at DESC');
    const expenses = await pool.query('SELECT category, SUM(amount) as total FROM expenses GROUP BY category');
    const userInput = req.body.prompt || 'Optimize our trade show budget allocation';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show budget optimization expert. Analyze spending patterns and recommend optimal budget allocation. Provide specific dollar amounts and percentages. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nBudgets:\n${JSON.stringify(budgets.rows, null, 2)}\n\nExpense Breakdown:\n${JSON.stringify(expenses.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'budget-optimizer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. AI Competitor Analyzer
router.post('/competitor-analyzer', auth, async (req, res) => {
  try {
    const competitors = await pool.query('SELECT * FROM competitors ORDER BY created_at DESC');
    const userInput = req.body.prompt || 'Analyze our competitors and suggest counter-strategies';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a competitive intelligence analyst specializing in trade shows. Analyze competitor presence, strategies, and provide actionable counter-strategies. Use markdown formatting with clear sections.' },
      { role: 'user', content: `${userInput}\n\nCompetitor Data:\n${JSON.stringify(competitors.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'competitor-analyzer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. AI Follow-up Email Generator
router.post('/followup-generator', auth, async (req, res) => {
  try {
    const followups = await pool.query('SELECT * FROM followups WHERE status != \'completed\' ORDER BY due_date ASC LIMIT 10');
    const userInput = req.body.prompt || 'Generate personalized follow-up emails for pending contacts';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are an expert at writing professional trade show follow-up communications. Generate personalized, engaging follow-up emails that reference the event and specific interactions. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nPending Follow-ups:\n${JSON.stringify(followups.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'followup-generator' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. AI Event Recommender
router.post('/event-recommender', auth, async (req, res) => {
  try {
    const events = await pool.query('SELECT * FROM events ORDER BY start_date DESC');
    const leads = await pool.query('SELECT event_id, COUNT(*) as lead_count, SUM(estimated_value) as total_value FROM leads GROUP BY event_id');
    const userInput = req.body.prompt || 'Recommend which events we should attend next year';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show strategy consultant. Based on historical performance data, recommend which types of events to attend, skip, or increase investment in. Provide specific reasoning. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nPast Events:\n${JSON.stringify(events.rows, null, 2)}\n\nLead Performance:\n${JSON.stringify(leads.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'event-recommender' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. AI Booth Design Advisor
router.post('/booth-advisor', auth, async (req, res) => {
  try {
    const booths = await pool.query('SELECT * FROM booths ORDER BY created_at DESC');
    const leads = await pool.query('SELECT b.booth_number, COUNT(l.id) as leads FROM booths b LEFT JOIN leads l ON b.event_id = l.event_id GROUP BY b.booth_number');
    const userInput = req.body.prompt || 'Advise on booth design and placement strategy';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show booth design and placement expert. Analyze booth data and provide recommendations for booth design, layout, placement, and visitor engagement strategies. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nBooth Data:\n${JSON.stringify(booths.rows, null, 2)}\n\nLead Generation by Booth:\n${JSON.stringify(leads.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'booth-advisor' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. AI Marketing Copy Generator
router.post('/marketing-copy', auth, async (req, res) => {
  try {
    const materials = await pool.query('SELECT * FROM materials ORDER BY created_at DESC LIMIT 10');
    const events = await pool.query('SELECT * FROM events WHERE status = \'upcoming\' LIMIT 5');
    const userInput = req.body.prompt || 'Generate marketing copy for our upcoming trade show materials';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a marketing copywriter specializing in trade show and conference materials. Generate compelling, professional marketing copy for various materials (brochures, banners, email invites, social media). Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nExisting Materials:\n${JSON.stringify(materials.rows, null, 2)}\n\nUpcoming Events:\n${JSON.stringify(events.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'marketing-copy' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. AI Staff Optimizer
router.post('/staff-optimizer', auth, async (req, res) => {
  try {
    const staff = await pool.query('SELECT * FROM staff ORDER BY created_at DESC');
    const events = await pool.query('SELECT * FROM events WHERE status = \'upcoming\'');
    const userInput = req.body.prompt || 'Optimize staff allocation across upcoming events';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show staffing expert. Analyze staff assignments, skills, and event requirements to optimize team allocation. Consider travel costs, expertise, and event importance. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nStaff Data:\n${JSON.stringify(staff.rows, null, 2)}\n\nUpcoming Events:\n${JSON.stringify(events.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'staff-optimizer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. AI Performance Reporter
router.post('/performance-reporter', auth, async (req, res) => {
  try {
    const [events, leads, expenses, sponsors, staff] = await Promise.all([
      pool.query('SELECT * FROM events'),
      pool.query('SELECT * FROM leads'),
      pool.query('SELECT * FROM expenses'),
      pool.query('SELECT * FROM sponsors'),
      pool.query('SELECT * FROM staff'),
    ]);
    const userInput = req.body.prompt || 'Generate a comprehensive performance report for all trade show activities';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a trade show performance analyst. Generate a comprehensive, executive-level performance report with KPIs, trends, and strategic recommendations. Include specific metrics and actionable insights. Use markdown formatting with headers, bullet points, and emphasis.' },
      { role: 'user', content: `${userInput}\n\nEvents: ${JSON.stringify(events.rows)}\nLeads: ${JSON.stringify(leads.rows)}\nExpenses: ${JSON.stringify(expenses.rows)}\nSponsors: ${JSON.stringify(sponsors.rows)}\nStaff: ${JSON.stringify(staff.rows)}` }
    ]);
    res.json({ result, type: 'performance-reporter' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 11. AI Sponsorship Advisor
router.post('/sponsorship-advisor', auth, async (req, res) => {
  try {
    const sponsors = await pool.query('SELECT * FROM sponsors ORDER BY amount DESC');
    const events = await pool.query('SELECT * FROM events');
    const userInput = req.body.prompt || 'Advise on sponsorship strategy and pricing';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a sponsorship strategy consultant for trade shows. Analyze current sponsorship data and provide recommendations for pricing tiers, benefits packages, and acquisition strategies. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nCurrent Sponsors:\n${JSON.stringify(sponsors.rows, null, 2)}\n\nEvents:\n${JSON.stringify(events.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'sponsorship-advisor' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 12. AI Networking Strategy
router.post('/networking-strategy', auth, async (req, res) => {
  try {
    const leads = await pool.query('SELECT * FROM leads ORDER BY estimated_value DESC LIMIT 15');
    const events = await pool.query('SELECT * FROM events WHERE status = \'upcoming\'');
    const userInput = req.body.prompt || 'Create a networking strategy for upcoming events';

    const result = await callOpenRouter([
      { role: 'system', content: 'You are a professional networking strategist for trade shows. Create detailed networking plans including who to target, conversation starters, and relationship-building tactics. Use markdown formatting.' },
      { role: 'user', content: `${userInput}\n\nHigh-Value Leads:\n${JSON.stringify(leads.rows, null, 2)}\n\nUpcoming Events:\n${JSON.stringify(events.rows, null, 2)}` }
    ]);
    res.json({ result, type: 'networking-strategy' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
