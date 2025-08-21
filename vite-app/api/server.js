const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Accept quote/emergency requests
// This is the main agent entry point. All agent logic is handled here using OpenAI API. No Python agent is needed.
app.post('/api/request', async (req, res) => {
  // All agent logic is handled here. Python agent is deprecated.
  const data = req.body;
  const prompt = `You are a master plumber and quoting specialist. Given the following intake data, generate a summary and recommendations for the technician. If more info is needed, ask clarifying questions.\n${JSON.stringify(data, null, 2)}`;
  try {
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful plumbing intake agent.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const agentReply = openaiRes.data.choices[0].message.content;
    if (/question|clarify|need more info|please provide|can you specify|missing/i.test(agentReply)) {
      return res.json({ followUp: agentReply });
    }
    const { error } = await supabase.from('requests').insert({ ...data, summary: agentReply });
    if (error) {
      return res.status(500).json({ error: 'Failed to log to Supabase.' });
    }
    return res.json({ summary: agentReply });
  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to contact agent.' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
