const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, location, venue, start_date, end_date, event_type, expected_attendees, registration_fee, status } = req.body;
    const result = await pool.query(
      `INSERT INTO events (name, description, location, venue, start_date, end_date, event_type, expected_attendees, registration_fee, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, description, location, venue, start_date, end_date, event_type, expected_attendees, registration_fee, status || 'upcoming']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, location, venue, start_date, end_date, event_type, expected_attendees, registration_fee, status } = req.body;
    const result = await pool.query(
      `UPDATE events SET name=$1, description=$2, location=$3, venue=$4, start_date=$5, end_date=$6, event_type=$7, expected_attendees=$8, registration_fee=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, description, location, venue, start_date, end_date, event_type, expected_attendees, registration_fee, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
