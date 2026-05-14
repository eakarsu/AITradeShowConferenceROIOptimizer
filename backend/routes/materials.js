const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', 'materials');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `material_${req.params.id}_${Date.now()}_${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, e.name as event_name FROM materials m
      LEFT JOIN events e ON m.event_id = e.id ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, e.name as event_name FROM materials m
      LEFT JOIN events e ON m.event_id = e.id WHERE m.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Material not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { event_id, name, material_type, quantity, unit_cost, vendor, design_status, print_status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO materials (event_id, name, material_type, quantity, unit_cost, vendor, design_status, print_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [event_id, name, material_type, quantity, unit_cost, vendor, design_status || 'draft', print_status || 'pending', notes]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { event_id, name, material_type, quantity, unit_cost, vendor, design_status, print_status, notes } = req.body;
    const result = await pool.query(
      `UPDATE materials SET event_id=$1, name=$2, material_type=$3, quantity=$4, unit_cost=$5, vendor=$6, design_status=$7, print_status=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [event_id, name, material_type, quantity, unit_cost, vendor, design_status, print_status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Material not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM materials WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Material not found' });
    res.json({ message: 'Material deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/materials/:id/upload - Upload material file
router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const { id } = req.params;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    await pool.query(
      `UPDATE materials SET notes = COALESCE(notes, '') || '\nFile: ${fileName}', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    res.json({ success: true, filename: fileName, path: filePath, message: 'File uploaded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
