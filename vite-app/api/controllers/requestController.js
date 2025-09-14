// vite-app/api/controllers/requestController.js
const path = require('path');
const axios = require('axios');
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

/**
 * Handles fetching all requests for admin dashboard or user's own requests.
 */
const getAllRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    let query = supabase
      .from('requests')
      .select(`*, user_profiles(name, email, phone), quote_attachments(*), quotes(*), request_notes(*)`)
      .order('created_at', { ascending: false });

    // If not admin, only show their own requests
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('❌ Get All Requests Error:', error);
      return res.status(500).json({ error: 'Failed to fetch requests.' });
    }

    console.log(`✅ Fetched ${requests?.length || 0} requests for ${isAdmin ? 'admin' : 'user'} ${userId}`);
    res.json(requests || []);
  } catch (err) {
    console.error('❌ Get All Requests Exception:', err);
    next(err);
  }
};

/**
 * Handles fetching a request by ID, including user profile info and all related tables.
 */
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    let query = supabase
      .from('requests')
      .select(`*, user_profiles!requests_user_id_fkey(*), quote_attachments(*), quotes(*), request_notes(*)`);

    // If not admin, only show their own requests
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    // Get the specific request
    const { data: request, error } = await query
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
 * Handles getting AI follow-up questions from GPT using a robust JSON contract.
 */
const getGptFollowUp = async (req, res, next) => {
  try {
    const { clarifyingAnswers, category, problem_description } = req.body;
    const isOtherCategory = category === 'other';
    const ambiguousKeywords = ['weird', 'strange', 'not sure', 'something else', 'intermittent', 'help'];
    const hasAmbiguousKeywords = problem_description && ambiguousKeywords.some(keyword => problem_description.toLowerCase().includes(keyword));

    // Efficiency Check: If the request is for a standard category and lacks ambiguous keywords,
    // we can skip the AI call entirely, saving cost and latency.
    if (!isOtherCategory && !hasAmbiguousKeywords) {
      console.log('[API EFFICIENCY] Skipping GPT-4 call for standard, clear request.');
      // Adhere to the contract even when skipping the call.
      return res.json({ requiresFollowUp: false, questions: [] });
    }

    // New, more robust prompt
const prompt = `
  You are an expert plumbing quote agent. Your task is to determine if more information is needed from a customer based on their answers.

  Analyze the conversation below for a "${category}" request:
  ${clarifyingAnswers.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')}

  Based *only* on the information provided, decide if you have enough detail to provide a preliminary quote.
  - If the user's answers are clear and sufficient, no follow-up is needed.
  - If there is ambiguity or missing critical information (e.g., location of a leak, type of fixture), you must ask clarifying questions.

  Respond with a JSON object in the following format:
  {
    "requiresFollowUp": boolean,
    "questions": ["question 1", "question 2", ...]
  }

  If no questions are needed, "questions" should be an empty array.
`;

    // The API call is now more robust.
    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-1106-preview', // A model that reliably supports JSON mode
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0.2,
        response_format: { type: 'json_object' } // This enforces the JSON output contract.
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const replyContent = gptResponse.data.choices[0].message.content;

    // The parsing logic is now simple, safe, and reliable.
    try {
      const parsedJson = JSON.parse(replyContent);
      const additionalQuestions = (parsedJson.requiresFollowUp && Array.isArray(parsedJson.questions))
        ? parsedJson.questions
        : [];
        
      res.json({ additionalQuestions }); // The frontend expects `additionalQuestions` key

    } catch (parseError) {
      console.error("CRITICAL: Failed to parse JSON response from OpenAI:", replyContent, parseError);
      // Fail gracefully: If parsing fails, assume no questions and proceed.
      res.json({ additionalQuestions: [] });
    }

  } catch (err) {
    next(err);
  }
};

/**
 * Handles the final submission of a new quote request.
 */
const submitQuoteRequest = async (req, res, next) => {
  try {
    const {
      clarifyingAnswers,
      contactInfo,
      category,
      isEmergency,
      property_type,
      is_homeowner,
      problem_description,
      preferred_timing,
      additional_notes,
      service_address,
      latitude,
      longitude,
      geocoded_address
    } = req.body;


    const requestData = {
      user_id: req.user.id,
      customer_name: contactInfo.name || null,
      service_address: service_address || `${contactInfo.address || ''}, ${contactInfo.city || ''}, ${contactInfo.province || ''} ${contactInfo.postal_code || ''}`.trim() || null,
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
      latitude: latitude || null,
      longitude: longitude || null,
      geocoded_address: geocoded_address || null,
    };


    const { data, error } = await supabase.from('requests').insert(requestData).select().single();
    if (error) throw error;

    await emailService.sendRequestSubmittedEmail(data);

    smsService.sendNewRequestNotification(data);

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
    const userId = req.user.id;

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    // If not admin, verify user owns this request
    if (!isAdmin) {
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('user_id')
        .eq('id', id)
        .single();

      if (requestError || !requestData) {
        return res.status(404).json({ error: 'Request not found.' });
      }

      if (requestData.user_id !== userId) {
        return res.status(403).json({ error: 'You can only accept quotes for your own requests.' });
      }
    }

    // 1. Run the existing stored procedure to update database state
    const { error: rpcError } = await supabase.rpc('accept_quote_and_update_request', {
      p_request_id: id,
      p_quote_id: quoteId,
    });
    if (rpcError) throw rpcError;

    // 2. Fetch all necessary data for notifications in a single block
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*, user_profiles(name)')
      .eq('id', id)
      .single();

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('quote_amount')
      .eq('id', quoteId)
      .single();

    // 3. Send notifications if data was fetched successfully
    if (requestError || quoteError) {
      console.error("Could not fetch data for notifications, but quote was accepted.", requestError || quoteError);
    } else if (requestData && quoteData) {
      // Send the existing status update email
      await emailService.sendStatusUpdateEmail(requestData);
      // Send the new SMS notification to admins
      smsService.sendQuoteAcceptedNotification(requestData, quoteData);
    }

    // 4. Send success response to the client
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
  getAllRequests,
  getRequestById,
  updateQuote,
  acceptQuote,
  updateRequestStatus,
};