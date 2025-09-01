// vite-app/api/controllers/requestController.js
const path = require('path');
const axios = require('axios');
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');

/**
 * Handles fetching a request by ID, including user profile info and all related tables.
 */
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: request, error } = await supabase
      .from('requests')
      .select(`*, user_profiles!requests_user_id_fkey(*), quote_attachments(*), quotes(*), request_notes(*)`)
      .eq('id', id)
      .single();
    if (error || !request) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    request.user_profiles = request.user_profiles || null;
    res.json(request);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles getting AI follow-up questions from GPT.
 */
const getGptFollowUp = async (req, res, next) => {
  try {
    const { clarifyingAnswers, category, problem_description } = req.body;
    const isOtherCategory = category === 'other';
    const ambiguousKeywords = ['weird', 'strange', 'not sure', 'something else', 'intermittent', 'help'];
    const hasAmbiguousKeywords = problem_description && ambiguousKeywords.some(keyword => problem_description.toLowerCase().includes(keyword));
    
    if (!isOtherCategory && !hasAmbiguousKeywords) {
      console.log('[API EFFICIENCY] Skipping GPT-4 call for standard, clear request.');
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
};

/**
 * Handles the final submission of a new quote request.
 */
const submitQuoteRequest = async (req, res, next) => {
  try {
    const { clarifyingAnswers, contactInfo, category, isEmergency, property_type, is_homeowner, problem_description, preferred_timing, additional_notes } = req.body;
    
    const requestData = {
      user_id: req.user.id,
      customer_name: contactInfo.name || null,
      service_address: `${contactInfo.address || ''}, ${contactInfo.city || ''}, ${contactInfo.province || ''} ${contactInfo.postal_code || ''}`.trim() || null,
      contact_info: contactInfo.email || contactInfo.phone || null,
      problem_category: category,
      is_emergency: isEmergency === true,
      property_type: property_type || null,
      is_homeowner: is_homeowner === 'Yes',
      problem_description: problem_description || null,
      preferred_timing: preferred_timing || null,
      additional_notes: additional_notes || null,
      answers: clarifyingAnswers,
      status: 'new',
    };
    
    const { data, error } = await supabase.from('requests').insert(requestData).select().single();
    if (error) throw error;

    await emailService.sendRequestSubmittedEmail(data);
    
    res.status(201).json({ message: 'Quote request submitted successfully.', request: data });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles uploading file attachments and linking them to a request and/or a quote.
 */
const uploadAttachment = async (req, res, next) => {
  try {
    const { request_id, quote_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required.' });
    }

    const { data: requestOwner, error: ownerError } = await supabase
      .from('requests')
      .select('user_id')
      .eq('id', request_id)
      .single();
      
    if (ownerError) {
        return res.status(404).json({ error: 'Request not found.' });
    }

    const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', req.user.id).single();

    if (profile?.role !== 'admin' && requestOwner.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to upload files for this request.' });
    }

    const uploadPromises = files.map(async (file) => {
      const sanitizedFileName = file.originalname.replace(/\s/g, '_');
      const pathSegments = ['public', request_id];
      if (quote_id) {
        pathSegments.push(quote_id);
      }
      pathSegments.push(sanitizedFileName);
      const filePath = pathSegments.join('/');
      
      const { error: uploadError } = await supabase.storage
        .from('PlumbingPoCBucket')
        .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });
      
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      return { 
        request_id,
        quote_id: quote_id || null,
        file_name: file.originalname, 
        mime_type: file.mimetype,
        file_url: filePath 
      };
    });

    const attachmentRecords = await Promise.all(uploadPromises);

    const { data: insertedAttachments, error: insertError } = await supabase
      .from('quote_attachments')
      .insert(attachmentRecords)
      .select();

    if (insertError) throw insertError;

    res.status(200).json({ message: 'Attachments uploaded successfully.', attachments: insertedAttachments });
  
  } catch (err) {
    next(err);
  }
};

/**
 * Handles retrieving a file from Supabase storage.
 */
const getStorageObject = async (req, res, next) => {
  try {
    const objectPath = req.params[0];
    const { data, error } = await supabase.storage.from('PlumbingPoCBucket').download(objectPath);
    
    if (error) {
      console.error('Supabase storage download error:', error.message);
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this file.' });
    }
    
    const fileName = path.basename(objectPath);
    res.setHeader('Content-Type', data.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    const buffer = Buffer.from(await data.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles adding a note to a request from either a customer or admin.
 */
const addRequestNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const { user } = req;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    const noteData = {
      request_id: id,
      user_id: user.id,
      note,
      author_role: profile.role === 'admin' ? 'admin' : 'customer',
    };

    const { data, error } = await supabase.from('request_notes').insert(noteData).select().single();
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles an admin creating a formal quote for a request.
 */
const createQuoteForRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quote_amount, details } = req.body;
    
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('user_id, contact_info')
      .eq('id', id)
      .single();
    if (requestError) throw requestError;

    const quoteData = {
      request_id: id,
      user_id: requestData.user_id,
      quote_amount,
      details,
      status: 'sent',
    };

    const { data: newQuote, error } = await supabase.from('quotes').insert(quoteData).select().single();
    if (error) throw error;
    
    await supabase.from('requests').update({ status: 'quoted' }).eq('id', id);

    await emailService.sendQuoteAddedEmail(requestData, newQuote);

    res.status(201).json(newQuote);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles an admin updating an existing quote for a request.
 */
const updateQuote = async (req, res, next) => {
  try {
    const { id, quoteId } = req.params;
    const { quote_amount, details } = req.body;

    const { data, error } = await supabase
      .from('quotes')
      .update({
        quote_amount,
        details,
      })
      .eq('id', quoteId)
      .eq('request_id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Quote not found or does not belong to this request.' });

    await supabase.from('requests').update({ status: 'quoted' }).eq('id', id);

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles accepting a specific quote, which also updates the parent request status.
 */
const acceptQuote = async (req, res, next) => {
  try {
    const { id, quoteId } = req.params;

    const { error } = await supabase.rpc('accept_quote_and_update_request', {
      p_request_id: id,
      p_quote_id: quoteId,
    });

    if (error) throw error;

    const { data: requestData } = await supabase.from('requests').select('*').eq('id', id).single();
    if (requestData) {
      await emailService.sendStatusUpdateEmail(requestData);
    }

    res.status(200).json({ message: 'Quote accepted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles an admin updating the status of a request.
 */
const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduled_start_date } = req.body;

    const updatePayload = { status };
    if (scheduled_start_date) {
        updatePayload.scheduled_start_date = new Date(scheduled_start_date).toISOString();
    }

    const { data, error } = await supabase
      .from('requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Request not found.' });

    await emailService.sendStatusUpdateEmail(data);

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGptFollowUp,
  submitQuoteRequest,
  uploadAttachment,
  getStorageObject,
  addRequestNote,
  createQuoteForRequest,
  getRequestById,
  updateQuote,
  acceptQuote,
  updateRequestStatus,
};