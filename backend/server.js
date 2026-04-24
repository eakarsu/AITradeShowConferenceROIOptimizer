const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/booths', require('./routes/booths'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/sponsors', require('./routes/sponsors'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/competitors', require('./routes/competitors'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
