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

app.post('/api/request', async (req, res) => {
  const { clarifyingAnswers, category } = req.body;

  if (!Array.isArray(clarifyingAnswers)) {
    return res.status(400).json({ error: 'clarifyingAnswers must be an array.' });
  }

  const prompt = `
You are a plumbing quote agent. Here are the user's answers for a ${category} quote:
${clarifyingAnswers.map((ans, i) => `Q${i + 1}: ${ans}`).join('\n')}

Do you have any additional follow-up questions to help with this plumbing quote? 
If not, reply: "No, this is perfect. No additional questions required."
If yes, list each follow-up question on a new line, starting each with a number (e.g., "1. What is...").
`;
  console.log("[GPT DEBUG] Prompt sent to GPT:\n", prompt);

  let additionalQuestions = [];
  try {
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.2,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = gptResponse.data.choices[0].message.content.trim();
    console.log("[GPT DEBUG] Raw response from GPT:\n", reply);

    if (!/no additional questions required/i.test(reply)) {
      additionalQuestions = reply
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0 && /^\d+\./.test(q))
        .map(q => q.replace(/^\d+\.\s*/, ''));
    }
    
    res.json({ additionalQuestions });

  } catch (err) {
    console.error("[GPT DEBUG] Error communicating with GPT:", err.response?.data || err.message);
    return res.status(500).json({ error: 'Error communicating with GPT', details: err.message });
  }
});

app.post('/api/submit-quote', async (req, res) => {
  // ✅ UPDATED: Destructure `preferred_timing` from the request body
  const {
    clarifyingAnswers,
    contactInfo,
    category,
    isEmergency,
    property_type,
    is_homeowner,
    problem_description,
    preferred_timing,
    additional_notes
  } = req.body;

  if (!clarifyingAnswers || !contactInfo || !category) {
    return res.status(400).json({ error: 'Missing required fields for quote submission.' });
  }

  const requestData = {
    customer_name: contactInfo.name || null,
    service_address: `${contactInfo.address || ''}, ${contactInfo.city || ''}, ${contactInfo.province || ''} ${contactInfo.postal_code || ''}`.trim() || null,
    contact_info: contactInfo.email || contactInfo.phone || null,
    problem_category: category,
    is_emergency: isEmergency === true,
    property_type: property_type || null,
    is_homeowner: is_homeowner === 'Yes',
    problem_description: problem_description || null,
    preferred_timing: preferred_timing || null, // ✅ NEW: Map the field to the database column
    additional_notes: additional_notes || null,
    answers: clarifyingAnswers,
    status: 'new',
  };

  const { error } = await supabase.from('requests').insert(requestData);

  if (error) {
    console.error("[SUBMIT QUOTE ERROR]", error.message);
    return res.status(500).json({ error: 'Failed to submit quote to Supabase.' });
  }

  res.status(200).json({ message: 'Quote request submitted successfully.' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});