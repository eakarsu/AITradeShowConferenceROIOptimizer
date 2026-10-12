const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');

// Explicitly opt in on a local development server; never expose configured
// credentials from a hosted instance or to a remote browser.
router.get('/demo-credentials', (req, res) => {
  const localAddress = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'true' || !localAddress) {
    return res.status(404).json({ error: 'Demo credential autofill is unavailable.' });
  }
  const pairs = [
    ['DEMO_ADMIN_EMAIL', 'DEMO_ADMIN_PASSWORD'],
    ['DEMO_EMAIL', 'DEMO_PASSWORD'],
    ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'],
    ['ADMIN_EMAIL', 'ADMIN_PASSWORD'],
    ['DEFAULT_EMAIL', 'DEFAULT_PASSWORD'],
  ];
  const pair = pairs.find(([emailKey, passwordKey]) => process.env[emailKey] && process.env[passwordKey]);
  if (!pair) return res.status(404).json({ error: 'No complete demo credential pair is configured.' });
  res.set('Cache-Control', 'no-store');
  res.json({ email: process.env[pair[0]], password: process.env[pair[1]] });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'user']
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load user' });
  }
});

module.exports = router;
