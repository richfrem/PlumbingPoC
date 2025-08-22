// server.js (v1.9 - Final: Includes file_url on DB insert to match schema)

const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { z } = require('zod');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// --- Basic Setup ---
const app = express();
const PORT = process.env.PORT || 3001;
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// --- Supabase & Multer Setup ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is missing from .env file");
}
const supabase = createClient(supabaseUrl, supabaseKey);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Middleware ---

// 1. CORS Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-frontend-domain.com' // TODO: Replace with your actual frontend URL
    : 'http://localhost:5173',
};
app.use(cors(corsOptions));

// 2. Body Parser
app.use(express.json());

// 3. Authentication Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing JWT token.' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
  }
  req.user = user;
  next();
};

// --- Zod Validation Schemas ---
const submitQuoteSchema = z.object({
  body: z.object({
    clarifyingAnswers: z.array(z.object({ question: z.string(), answer: z.string() })),
    contactInfo: z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postal_code: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }),
    category: z.string(),
    isEmergency: z.boolean().optional(),
    property_type: z.string().optional(),
    is_homeowner: z.string().optional(),
    problem_description: z.string().optional(),
    preferred_timing: z.string().optional(),
    additional_notes: z.string().optional(),
  }),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (error) {
    res.status(400).json({ error: 'Validation failed', details: error.errors });
  }
};

// --- API Routes ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/request', authenticate, async (req, res, next) => {
  try {
    const { clarifyingAnswers, category, problem_description } = req.body;
    const isOtherCategory = category === 'other';
    const ambiguousKeywords = ['weird', 'strange', 'not sure', 'something else', 'intermittent', 'help'];
    const hasAmbiguousKeywords = problem_description && ambiguousKeywords.some(keyword => problem_description.toLowerCase().includes(keyword));
    
    if (!isOtherCategory && !hasAmbiguousKeywords) {
      return res.json({ additionalQuestions: [] });
    }
    
    const prompt = `
      You are a plumbing quote agent. Here are the user's answers for a ${category} quote:
      ${clarifyingAnswers.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')}
      Do you have any additional follow-up questions? If not, reply: "No, this is perfect. No additional questions required." If yes, list each follow-up question on a new line, starting each with a number (e.g., "1. What is...").
    `;

    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', 
      { model: 'gpt-4', messages: [{ role: 'user', content: prompt }], max_tokens: 200, temperature: 0.2 },
      { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    
    const reply = gptResponse.data.choices[0].message.content.trim();
    let additionalQuestions = [];
    if (!/no additional questions required/i.test(reply)) {
      additionalQuestions = reply.split('\n').map(q => q.trim()).filter(q => /^\d+\./.test(q)).map(q => q.replace(/^\d+\.\s*/, ''));
    }
    res.json({ additionalQuestions });

  } catch (err) {
    next(err);
  }
});

app.post('/api/submit-quote', authenticate, validate(submitQuoteSchema), async (req, res, next) => {
  try {
    const { clarifyingAnswers, contactInfo, category, isEmergency, property_type, is_homeowner, problem_description, preferred_timing, additional_notes } = req.body;
    
    const requestData = {
      user_id: req.user.id,
      customer_name: contactInfo.name || null,
      service_address: `${contactInfo.address || ''}, ${contactInfo.city || ''}, ${contactInfo.province || ''} ${contactInfo.postal_code || ''}`.trim() || null,
      contact_info: contactInfo.email || contactInfo.phone || null,
      problem_category: category, is_emergency: isEmergency === true, property_type: property_type || null,
      is_homeowner: is_homeowner === 'Yes', problem_description: problem_description || null,
      preferred_timing: preferred_timing || null, additional_notes: additional_notes || null,
      answers: clarifyingAnswers, status: 'new',
    };
    
    const { data, error } = await supabase.from('requests').insert(requestData).select().single();
    if (error) throw error;
    
    res.status(200).json({ message: 'Quote request submitted successfully.', request: data });
  } catch (err) {
    next(err);
  }
});

app.post('/api/upload-attachment', authenticate, upload.single('attachment'), async (req, res, next) => {
  try {
    const { request_id } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded.' });
    if (!request_id) return res.status(400).json({ error: 'request_id is required.' });

    const { data: requestOwner, error: ownerError } = await supabase.from('requests').select('user_id').eq('id', request_id).single();
    if (ownerError) throw ownerError;
    if (!requestOwner || requestOwner.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this quote request.' });
    }
    
    const filePath = `${request_id}/${file.originalname.replace(/\s/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('PlumbingPoCBucket')
      .upload(filePath, file.buffer, { contentType: file.mimetype });
    if (uploadError) throw uploadError;

    // After uploading, get the public URL for the file to satisfy the NOT NULL constraint.
    const { data: urlData } = supabase.storage
      .from('PlumbingPoCBucket')
      .getPublicUrl(uploadData.path);

    // Create the full record that now matches the table schema perfectly.
    const attachmentRecord = { 
      request_id, 
      file_name: file.originalname, 
      mime_type: file.mimetype,
      file_url: urlData.publicUrl 
    };

    const { error: insertError } = await supabase.from('quote_attachments').insert(attachmentRecord);
    if (insertError) throw insertError;

    res.status(200).json({ message: 'Attachment uploaded successfully.', attachment: attachmentRecord });
  
  } catch (err) {
    next(err);
  }
});

app.get('/api/storage/object/*', authenticate, async (req, res, next) => {
  try {
    const objectPath = req.params[0];
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', req.user.id).single();
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const { data, error } = await supabase.storage.from('PlumbingPoCBucket').download(objectPath);
    if (error) {
      return error.message.includes('not found')
        ? res.status(404).send('Object not found.')
        : next(error);
    }
    
    const fileName = path.basename(objectPath);
    res.setHeader('Content-Type', data.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    const buffer = Buffer.from(await data.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// --- Centralized Error Handler ---
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  res.status(500).json({
    error: 'An unexpected error occurred on the server.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});