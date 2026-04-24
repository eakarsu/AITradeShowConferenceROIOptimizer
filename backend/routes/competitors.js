const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, e.name as event_name FROM competitors c
      LEFT JOIN events e ON c.event_id = e.id ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, e.name as event_name FROM competitors c
      LEFT JOIN events e ON c.event_id = e.id WHERE c.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Competitor not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, company_name, booth_location, booth_size, products_displayed, marketing_tactics, staff_count, estimated_budget, threat_level, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO competitors (event_id, company_name, booth_location, booth_size, products_displayed, marketing_tactics, staff_count, estimated_budget, threat_level, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [event_id, company_name, booth_location, booth_size, products_displayed, marketing_tactics, staff_count, estimated_budget, threat_level || 'medium', notes]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, company_name, booth_location, booth_size, products_displayed, marketing_tactics, staff_count, estimated_budget, threat_level, notes } = req.body;
    const result = await pool.query(
      `UPDATE competitors SET event_id=$1, company_name=$2, booth_location=$3, booth_size=$4, products_displayed=$5, marketing_tactics=$6, staff_count=$7, estimated_budget=$8, threat_level=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [event_id, company_name, booth_location, booth_size, products_displayed, marketing_tactics, staff_count, estimated_budget, threat_level, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Competitor not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM competitors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Competitor not found' });
    res.json({ message: 'Competitor deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
