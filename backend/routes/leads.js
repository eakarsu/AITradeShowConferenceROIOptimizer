const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, e.name as event_name FROM leads l
      LEFT JOIN events e ON l.event_id = e.id ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, e.name as event_name FROM leads l
      LEFT JOIN events e ON l.event_id = e.id WHERE l.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, contact_name, company, email, phone, job_title, interest_level, notes, estimated_value, status } = req.body;
    const result = await pool.query(
      `INSERT INTO leads (event_id, contact_name, company, email, phone, job_title, interest_level, notes, estimated_value, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [event_id, contact_name, company, email, phone, job_title, interest_level, notes, estimated_value, status || 'new']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, contact_name, company, email, phone, job_title, interest_level, notes, estimated_value, status } = req.body;
    const result = await pool.query(
      `UPDATE leads SET event_id=$1, contact_name=$2, company=$3, email=$4, phone=$5, job_title=$6, interest_level=$7, notes=$8, estimated_value=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [event_id, contact_name, company, email, phone, job_title, interest_level, notes, estimated_value, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
