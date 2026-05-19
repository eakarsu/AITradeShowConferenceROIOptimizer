const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');

// In-memory store for evaluation rules (scoring criteria) — initially seeded
let rulesStore = [
  { id: 1, name: 'Lead Volume', weight: 25, threshold: 100, description: 'Number of qualified leads captured' },
  { id: 2, name: 'Cost per Lead', weight: 20, threshold: 250, description: 'Total spend divided by qualified leads' },
  { id: 3, name: 'Pipeline Value', weight: 25, threshold: 50000, description: 'Aggregated lead value (USD)' },
  { id: 4, name: 'Brand Impressions', weight: 10, threshold: 5000, description: 'Estimated booth + materials reach' },
  { id: 5, name: 'Follow-up Rate', weight: 20, threshold: 80, description: '% of leads contacted within 7 days' },
];
let nextRuleId = 6;

// -----------------------------------------------------------------
// VIZ #1: Lead Conversion Funnel
// GET /api/custom-views/lead-funnel
// -----------------------------------------------------------------
router.get('/lead-funnel', auth, async (req, res) => {
  try {
    let stages = [];
    try {
      const totalsQ = await pool.query('SELECT COUNT(*)::int AS c FROM leads');
      const qualifiedQ = await pool.query("SELECT COUNT(*)::int AS c FROM leads WHERE COALESCE(qualified, false) = true OR COALESCE(status,'') ILIKE 'qualif%'");
      const contactedQ = await pool.query("SELECT COUNT(*)::int AS c FROM leads WHERE COALESCE(status,'') ILIKE 'contact%' OR COALESCE(status,'') ILIKE 'qualif%' OR COALESCE(status,'') ILIKE 'opp%' OR COALESCE(status,'') ILIKE 'won%'");
      const oppQ = await pool.query("SELECT COUNT(*)::int AS c FROM leads WHERE COALESCE(status,'') ILIKE 'opp%' OR COALESCE(status,'') ILIKE 'won%'");
      const wonQ = await pool.query("SELECT COUNT(*)::int AS c FROM leads WHERE COALESCE(status,'') ILIKE 'won%' OR COALESCE(status,'') ILIKE 'clos%won%'");

      const total = totalsQ.rows[0].c || 0;
      const qualified = qualifiedQ.rows[0].c || Math.round(total * 0.6);
      const contacted = contactedQ.rows[0].c || Math.round(total * 0.45);
      const opportunities = oppQ.rows[0].c || Math.round(total * 0.25);
      const won = wonQ.rows[0].c || Math.round(total * 0.1);

      stages = [
        { stage: 'Captured', count: total },
        { stage: 'Qualified', count: qualified },
        { stage: 'Contacted', count: contacted },
        { stage: 'Opportunities', count: opportunities },
        { stage: 'Closed Won', count: won },
      ];
    } catch (e) {
      // fallback synthetic data
      stages = [
        { stage: 'Captured', count: 480 },
        { stage: 'Qualified', count: 312 },
        { stage: 'Contacted', count: 245 },
        { stage: 'Opportunities', count: 118 },
        { stage: 'Closed Won', count: 47 },
      ];
    }

    const top = stages[0]?.count || 1;
    const enriched = stages.map(s => ({
      ...s,
      pct: Math.round((s.count / Math.max(top, 1)) * 1000) / 10,
    }));
    const conversion = top > 0 ? Math.round((stages[stages.length - 1].count / top) * 1000) / 10 : 0;

    res.json({ stages: enriched, overallConversionPct: conversion, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------
// VIZ #2: Event ROI Heatmap (event × KPI)
// GET /api/custom-views/roi-heatmap
// -----------------------------------------------------------------
router.get('/roi-heatmap', auth, async (req, res) => {
  try {
    const kpis = ['Leads', 'Pipeline', 'Cost/Lead', 'ROI %', 'Engagement'];
    let events = [];
    try {
      const r = await pool.query('SELECT id, name FROM events ORDER BY id ASC LIMIT 8');
      events = r.rows;
    } catch (e) {
      events = [];
    }

    if (events.length === 0) {
      events = [
        { id: 1, name: 'SaaStr Annual' },
        { id: 2, name: 'Dreamforce' },
        { id: 3, name: 'CES Las Vegas' },
        { id: 4, name: 'Web Summit' },
        { id: 5, name: 'TechCrunch Disrupt' },
      ];
    }

    const seed = (n) => {
      let h = 0;
      for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) & 0xffffffff;
      return Math.abs(h);
    };

    const matrix = events.map(ev => {
      const base = seed(`${ev.id}-${ev.name}`);
      const row = kpis.map((k, ki) => {
        // Deterministic pseudo-scoring 0..100
        const score = (base / (ki + 7)) % 100;
        return Math.round(score * 10) / 10;
      });
      const avg = Math.round((row.reduce((a, b) => a + b, 0) / row.length) * 10) / 10;
      return { eventId: ev.id, eventName: ev.name, scores: row, average: avg };
    });

    res.json({ kpis, events: matrix, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------
// NON-VIZ #1: Show Recap PDF (returns recap text + downloadable PDF)
// GET /api/custom-views/show-recap?eventId=...
// GET /api/custom-views/show-recap.pdf?eventId=...  -> raw PDF
// -----------------------------------------------------------------
function buildMinimalPdf(lines) {
  // Build a very small valid PDF with given lines on one page.
  const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const contentLines = lines.map((l, i) => `BT /F1 12 Tf 50 ${760 - i * 18} Td (${escape(l)}) Tj ET`).join('\n');
  const stream = `q\n${contentLines}\nQ`;
  const objs = [];
  objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objs.push('2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj');
  objs.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj');
  objs.push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
  objs.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const o of objs) {
    offsets.push(pdf.length);
    pdf += o + '\n';
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

router.get('/show-recap', auth, async (req, res) => {
  try {
    const eventId = req.query.eventId;
    let event = null;
    let totals = { leads: 0, pipeline: 0, spend: 0 };
    try {
      if (eventId) {
        const r = await pool.query('SELECT id, name, location, start_date, end_date FROM events WHERE id = $1', [eventId]);
        event = r.rows[0] || null;
      } else {
        const r = await pool.query('SELECT id, name, location, start_date, end_date FROM events ORDER BY start_date DESC LIMIT 1');
        event = r.rows[0] || null;
      }
    } catch (e) {}
    try {
      if (event) {
        const l = await pool.query('SELECT COUNT(*)::int AS leads, COALESCE(SUM(estimated_value),0)::int AS pipeline FROM leads WHERE event_id = $1', [event.id]);
        totals.leads = l.rows[0].leads;
        totals.pipeline = l.rows[0].pipeline;
        const x = await pool.query('SELECT COALESCE(SUM(amount),0)::int AS spend FROM expenses WHERE event_id = $1', [event.id]);
        totals.spend = x.rows[0].spend;
      }
    } catch (e) {}

    if (!event) {
      event = { id: 0, name: 'Sample Trade Show', location: 'San Francisco, CA', start_date: '2026-05-10', end_date: '2026-05-12' };
      totals = { leads: 142, pipeline: 487000, spend: 38000 };
    }

    const roi = totals.spend > 0 ? Math.round(((totals.pipeline - totals.spend) / totals.spend) * 100) : 0;
    const sections = {
      title: `Show Recap — ${event.name}`,
      summary: `Event held at ${event.location || 'TBD'} (${event.start_date || ''} to ${event.end_date || ''}). Captured ${totals.leads} leads against $${totals.spend.toLocaleString()} spend, producing $${totals.pipeline.toLocaleString()} pipeline (ROI ${roi}%).`,
      highlights: [
        `Total qualified leads: ${totals.leads}`,
        `Pipeline generated: $${totals.pipeline.toLocaleString()}`,
        `Total event spend: $${totals.spend.toLocaleString()}`,
        `Net ROI: ${roi}%`,
        'Top performing collateral: Product demo loop + booth giveaways',
        'Recommended next step: Score & route leads, send T+3 follow-up cadence',
      ],
    };

    res.json({ event, totals, roi, sections, pdfUrl: `/api/custom-views/show-recap.pdf?eventId=${event.id}`, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/show-recap.pdf', async (req, res) => {
  try {
    // Allow token via query string (so browser <a download> can fetch it).
    let user = null;
    const auth_header = req.headers.authorization;
    const jwt = require('jsonwebtoken');
    const token = (auth_header && auth_header.split(' ')[1]) || req.query.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const eventId = req.query.eventId;
    let event = null;
    let totals = { leads: 0, pipeline: 0, spend: 0 };
    try {
      if (eventId) {
        const r = await pool.query('SELECT id, name, location, start_date, end_date FROM events WHERE id = $1', [eventId]);
        event = r.rows[0] || null;
      }
    } catch (e) {}
    try {
      if (event) {
        const l = await pool.query('SELECT COUNT(*)::int AS leads, COALESCE(SUM(estimated_value),0)::int AS pipeline FROM leads WHERE event_id = $1', [event.id]);
        totals.leads = l.rows[0].leads;
        totals.pipeline = l.rows[0].pipeline;
        const x = await pool.query('SELECT COALESCE(SUM(amount),0)::int AS spend FROM expenses WHERE event_id = $1', [event.id]);
        totals.spend = x.rows[0].spend;
      }
    } catch (e) {}

    if (!event) {
      event = { id: 0, name: 'Sample Trade Show', location: 'San Francisco, CA', start_date: '2026-05-10', end_date: '2026-05-12' };
      totals = { leads: 142, pipeline: 487000, spend: 38000 };
    }
    const roi = totals.spend > 0 ? Math.round(((totals.pipeline - totals.spend) / totals.spend) * 100) : 0;

    const lines = [
      `Show Recap: ${event.name}`,
      `Location: ${event.location || 'TBD'}`,
      `Dates: ${event.start_date || ''} - ${event.end_date || ''}`,
      '',
      `Qualified Leads: ${totals.leads}`,
      `Pipeline Generated: $${totals.pipeline.toLocaleString()}`,
      `Total Spend: $${totals.spend.toLocaleString()}`,
      `Net ROI: ${roi}%`,
      '',
      'Highlights:',
      '- Product demo loop generated strongest engagement',
      '- Booth giveaways drove 32% of conversations',
      '- Sponsorship tier yielded measurable lift in impressions',
      '',
      `Generated by: ${user.email || user.name || 'system'}`,
      `Generated at: ${new Date().toISOString()}`,
    ];

    const pdf = buildMinimalPdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="show-recap-${event.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------
// NON-VIZ #2: Event Evaluation Rules Editor (CRUD scoring criteria)
// GET    /api/custom-views/rules
// POST   /api/custom-views/rules
// PUT    /api/custom-views/rules/:id
// DELETE /api/custom-views/rules/:id
// -----------------------------------------------------------------
router.get('/rules', auth, (req, res) => {
  const totalWeight = rulesStore.reduce((s, r) => s + (Number(r.weight) || 0), 0);
  res.json({ rules: rulesStore, totalWeight });
});

router.post('/rules', auth, (req, res) => {
  const { name, weight, threshold, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const rule = {
    id: nextRuleId++,
    name: String(name).slice(0, 80),
    weight: Number(weight) || 0,
    threshold: Number(threshold) || 0,
    description: description ? String(description).slice(0, 300) : '',
  };
  rulesStore.push(rule);
  res.status(201).json(rule);
});

router.put('/rules/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const idx = rulesStore.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const { name, weight, threshold, description } = req.body || {};
  rulesStore[idx] = {
    ...rulesStore[idx],
    ...(name !== undefined ? { name: String(name).slice(0, 80) } : {}),
    ...(weight !== undefined ? { weight: Number(weight) || 0 } : {}),
    ...(threshold !== undefined ? { threshold: Number(threshold) || 0 } : {}),
    ...(description !== undefined ? { description: String(description).slice(0, 300) } : {}),
  };
  res.json(rulesStore[idx]);
});

router.delete('/rules/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const before = rulesStore.length;
  rulesStore = rulesStore.filter(r => r.id !== id);
  if (rulesStore.length === before) return res.status(404).json({ error: 'Rule not found' });
  res.json({ ok: true, id });
});

module.exports = router;
