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

  // Ensure clarifyingAnswers is an array
  if (!Array.isArray(clarifyingAnswers)) {
    return res.status(400).json({ error: 'clarifyingAnswers must be an array.' });
  }

  // Compose prompt for GPT
  const prompt = `
You are a plumbing quote agent. Here are the user's answers for a ${category} quote:
${clarifyingAnswers.map((ans, i) => `Q${i + 1}: ${ans}`).join('\n')}

Do you have any additional follow-up questions to help with this plumbing quote? 
If not, reply: "No, this is perfect. No additional questions required."
If yes, list each follow-up question on a new line, starting each with a number (e.g., "1. What is...").
`;
  console.log("[GPT DEBUG] Prompt sent to GPT:\n", prompt);

  let additionalQuestions = [];
  let gptConfirmation = "";
  let gptReply = "";

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
    gptReply = reply;

    if (/no additional questions required/i.test(reply)) {
      gptConfirmation = reply;
    } else {
      // ✅ CORRECTED: This new parsing logic is more robust.
      // It filters for lines that look like list items and cleans them up.
      additionalQuestions = reply
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0 && /^\d+\./.test(q)) // Only keep lines that start with a number and a period.
        .map(q => q.replace(/^\d+\.\s*/, '')); // Remove the leading "1. ", "2. ", etc.
    }
  } catch (err) {
    console.error("[GPT DEBUG] Error communicating with GPT:", err.response?.data || err.message);
    return res.status(500).json({ error: 'Error communicating with GPT', details: err.message });
  }
  
  // This Supabase logging might be better after the quote is fully submitted,
  // but leaving it here as per your original structure.
  const { error } = await supabase.from('requests').insert({ 
    answers: clarifyingAnswers, 
    category: category, 
    summary: gptConfirmation 
  });
  if (error) {
    console.error("[SUPABASE ERROR]", error.message);
    // We don't want to fail the whole request if logging fails, so we won't return here.
    // The user should still get their questions.
  }

  res.json({
    additionalQuestions,
    gptConfirmation,
    gptReply,
  });
});

// Added a simple endpoint for submitting the final quote data
app.post('/api/submit-quote', async (req, res) => {
    const { clarifyingAnswers, contactInfo, category } = req.body;
    
    // You can add more robust validation here
    if (!clarifyingAnswers || !contactInfo || !category) {
        return res.status(400).json({ error: 'Missing required fields for quote submission.' });
    }

    const { error } = await supabase.from('submitted_quotes').insert({
        answers: clarifyingAnswers,
        contact_info: contactInfo,
        category: category,
        status: 'new'
    });

    if (error) {
        console.error("[SUBMIT QUOTE ERROR]", error.message);
        return res.status(500).json({ error: 'Failed to submit quote to Supabase.' });
    }

    res.status(200).json({ message: 'Quote submitted successfully.' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});