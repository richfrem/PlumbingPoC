const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Accept quote/emergency requests
app.post('/api/request', (req, res) => {
  const data = req.body;
  // TODO: Store in database (Supabase, etc.)
  console.log('Received request:', data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
