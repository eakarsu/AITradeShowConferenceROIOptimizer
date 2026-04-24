const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, e.name as event_name FROM budgets b
      LEFT JOIN events e ON b.event_id = e.id ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, e.name as event_name FROM budgets b
      LEFT JOIN events e ON b.event_id = e.id WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, category, planned_amount, actual_amount, variance_notes, fiscal_year, quarter, approval_status } = req.body;
    const result = await pool.query(
      `INSERT INTO budgets (event_id, category, planned_amount, actual_amount, variance_notes, fiscal_year, quarter, approval_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [event_id, category, planned_amount, actual_amount || 0, variance_notes, fiscal_year, quarter, approval_status || 'draft']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, category, planned_amount, actual_amount, variance_notes, fiscal_year, quarter, approval_status } = req.body;
    const result = await pool.query(
      `UPDATE budgets SET event_id=$1, category=$2, planned_amount=$3, actual_amount=$4, variance_notes=$5, fiscal_year=$6, quarter=$7, approval_status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [event_id, category, planned_amount, actual_amount, variance_notes, fiscal_year, quarter, approval_status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM budgets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
