const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, e.name as event_name FROM booths b
      LEFT JOIN events e ON b.event_id = e.id ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, e.name as event_name FROM booths b
      LEFT JOIN events e ON b.event_id = e.id WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booth not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, booth_number, size, location_in_venue, rental_cost, setup_cost, booth_type, amenities, status } = req.body;
    const result = await pool.query(
      `INSERT INTO booths (event_id, booth_number, size, location_in_venue, rental_cost, setup_cost, booth_type, amenities, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [event_id, booth_number, size, location_in_venue, rental_cost, setup_cost, booth_type, amenities, status || 'reserved']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, booth_number, size, location_in_venue, rental_cost, setup_cost, booth_type, amenities, status } = req.body;
    const result = await pool.query(
      `UPDATE booths SET event_id=$1, booth_number=$2, size=$3, location_in_venue=$4, rental_cost=$5, setup_cost=$6, booth_type=$7, amenities=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [event_id, booth_number, size, location_in_venue, rental_cost, setup_cost, booth_type, amenities, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booth not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM booths WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booth not found' });
    res.json({ message: 'Booth deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
