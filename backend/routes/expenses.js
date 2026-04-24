const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ex.*, e.name as event_name FROM expenses ex
      LEFT JOIN events e ON ex.event_id = e.id ORDER BY ex.expense_date DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ex.*, e.name as event_name FROM expenses ex
      LEFT JOIN events e ON ex.event_id = e.id WHERE ex.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, category, description, amount, vendor, expense_date, payment_method, receipt_number, status } = req.body;
    const result = await pool.query(
      `INSERT INTO expenses (event_id, category, description, amount, vendor, expense_date, payment_method, receipt_number, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [event_id, category, description, amount, vendor, expense_date, payment_method, receipt_number, status || 'pending']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, category, description, amount, vendor, expense_date, payment_method, receipt_number, status } = req.body;
    const result = await pool.query(
      `UPDATE expenses SET event_id=$1, category=$2, description=$3, amount=$4, vendor=$5, expense_date=$6, payment_method=$7, receipt_number=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [event_id, category, description, amount, vendor, expense_date, payment_method, receipt_number, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
