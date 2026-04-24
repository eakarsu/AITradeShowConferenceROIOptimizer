const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sp.*, e.name as event_name FROM sponsors sp
      LEFT JOIN events e ON sp.event_id = e.id ORDER BY sp.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sp.*, e.name as event_name FROM sponsors sp
      LEFT JOIN events e ON sp.event_id = e.id WHERE sp.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sponsor not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, company_name, contact_name, email, phone, sponsorship_level, amount, benefits, contract_status } = req.body;
    const result = await pool.query(
      `INSERT INTO sponsors (event_id, company_name, contact_name, email, phone, sponsorship_level, amount, benefits, contract_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [event_id, company_name, contact_name, email, phone, sponsorship_level, amount, benefits, contract_status || 'pending']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, company_name, contact_name, email, phone, sponsorship_level, amount, benefits, contract_status } = req.body;
    const result = await pool.query(
      `UPDATE sponsors SET event_id=$1, company_name=$2, contact_name=$3, email=$4, phone=$5, sponsorship_level=$6, amount=$7, benefits=$8, contract_status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [event_id, company_name, contact_name, email, phone, sponsorship_level, amount, benefits, contract_status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sponsor not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sponsors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sponsor not found' });
    res.json({ message: 'Sponsor deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
