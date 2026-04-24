const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const [events, leads, expenses, staff, booths, sponsors] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'upcoming\') as upcoming, COUNT(*) FILTER (WHERE status = \'completed\') as completed FROM events'),
      pool.query('SELECT COUNT(*) as total, COALESCE(SUM(estimated_value),0) as total_value FROM leads'),
      pool.query('SELECT COALESCE(SUM(amount),0) as total_spent FROM expenses'),
      pool.query('SELECT COUNT(*) as total FROM staff'),
      pool.query('SELECT COUNT(*) as total FROM booths'),
      pool.query('SELECT COALESCE(SUM(amount),0) as total_sponsorship FROM sponsors'),
    ]);

    const totalRevenue = parseFloat(leads.rows[0].total_value);
    const totalSpent = parseFloat(expenses.rows[0].total_spent);
    const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent * 100).toFixed(1) : 0;

    res.json({
      events: events.rows[0],
      leads: { total: parseInt(leads.rows[0].total), total_value: totalRevenue },
      expenses: { total_spent: totalSpent },
      staff: { total: parseInt(staff.rows[0].total) },
      booths: { total: parseInt(booths.rows[0].total) },
      sponsors: { total_sponsorship: parseFloat(sponsors.rows[0].total_sponsorship) },
      roi: parseFloat(roi),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
