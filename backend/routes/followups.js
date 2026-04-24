const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, e.name as event_name FROM followups f
      LEFT JOIN events e ON f.event_id = e.id ORDER BY f.due_date ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, e.name as event_name FROM followups f
      LEFT JOIN events e ON f.event_id = e.id WHERE f.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, contact_name, company, email, followup_type, priority, due_date, assigned_to, notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO followups (event_id, contact_name, company, email, followup_type, priority, due_date, assigned_to, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [event_id, contact_name, company, email, followup_type, priority, due_date, assigned_to, notes, status || 'pending']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, contact_name, company, email, followup_type, priority, due_date, assigned_to, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE followups SET event_id=$1, contact_name=$2, company=$3, email=$4, followup_type=$5, priority=$6, due_date=$7, assigned_to=$8, notes=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [event_id, contact_name, company, email, followup_type, priority, due_date, assigned_to, notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM followups WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Follow-up not found' });
    res.json({ message: 'Follow-up deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
