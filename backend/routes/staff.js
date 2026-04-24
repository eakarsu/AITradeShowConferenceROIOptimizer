const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, e.name as event_name FROM staff s
      LEFT JOIN events e ON s.event_id = e.id ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, e.name as event_name FROM staff s
      LEFT JOIN events e ON s.event_id = e.id WHERE s.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, name, role, department, email, phone, travel_cost, hotel_cost, per_diem, status } = req.body;
    const result = await pool.query(
      `INSERT INTO staff (event_id, name, role, department, email, phone, travel_cost, hotel_cost, per_diem, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [event_id, name, role, department, email, phone, travel_cost, hotel_cost, per_diem, status || 'confirmed']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, name, role, department, email, phone, travel_cost, hotel_cost, per_diem, status } = req.body;
    const result = await pool.query(
      `UPDATE staff SET event_id=$1, name=$2, role=$3, department=$4, email=$5, phone=$6, travel_cost=$7, hotel_cost=$8, per_diem=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [event_id, name, role, department, email, phone, travel_cost, hotel_cost, per_diem, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM staff WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
