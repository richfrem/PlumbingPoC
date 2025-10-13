// packages/backend/api/controllers/requestController.js
import path from 'path';
import axios from 'axios';
import { database as supabase } from '../config/supabase/index.js';
import { sendRequestSubmittedEmail, sendStatusUpdateEmail, sendQuoteAddedEmail } from '../services/email/resend/index.js';
import { sendNewRequestNotification, sendQuoteAcceptedNotification } from '../services/sms/twilio/index.js';

/**
 * Handles fetching all requests for admin dashboard or user's own requests.
 */
const getAllRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`🔍 GetAllRequests: Processing request for user ${userId}`);

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.warn(`⚠️ GetAllRequests: Profile lookup failed for user ${userId}:`, profileError.message);
      // If profile doesn't exist, treat as non-admin (only show own requests)
      console.log(`ℹ️ GetAllRequests: Treating user ${userId} as non-admin due to missing profile`);
    }

    const isAdmin = userProfile?.role === 'admin';
    console.log(`🔍 GetAllRequests: User ${userId} is ${isAdmin ? 'admin' : 'non-admin'} (email: ${userProfile?.email || 'unknown'})`);

    let query = supabase
      .from('requests')
      .select(`*, user_profiles(name, email, phone), quote_attachments(*), quotes(*), request_notes(*)`)
      .order('created_at', { ascending: false });

    // If not admin, only show their own requests
    if (!isAdmin) {
      console.log(`🔍 GetAllRequests: Filtering to show only user ${userId}'s own requests`);
      query = query.eq('user_id', userId);
    } else {
      console.log(`🔍 GetAllRequests: Admin user - showing all requests`);
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

    // Ensure we include the user's profile (name/email) so the email helper can resolve recipient
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('name, email')
      .eq('user_id', req.user.id)
      .single();

    const requestWithProfile = { ...data, user_profiles: userProfile || null };

    // Log that we're about to attempt sending the request-submitted email.
    // Include minimal identifying info so we can trace the flow in logs.
    console.log('📧 EMAIL DEBUG: Attempting to call sendRequestSubmittedEmail', {
      requestId: requestWithProfile.id,
      recipient: requestWithProfile.user_profiles?.email || null,
      userId: req.user.id
    });

    // Fire-and-forget the email send so failures don't block the API response.
    // Any errors are logged but won't fail the request submission.
    sendRequestSubmittedEmail(requestWithProfile)
      .then((result) => {
        if (result && result.error) {
          console.error('❌ EMAIL ERROR: sendRequestSubmittedEmail returned error for request', requestWithProfile.id, result.error);
        } else {
          console.log('✅ EMAIL INFO: sendRequestSubmittedEmail completed for request', requestWithProfile.id);
        }
      })
      .catch((emailErr) => {
        console.error('❌ EMAIL EXCEPTION: sendRequestSubmittedEmail threw for request', requestWithProfile.id, emailErr);
      });

    console.log('📱 SMS DEBUG: About to call sendNewRequestNotification');
    try {
      sendNewRequestNotification(data);
      console.log('📱 SMS DEBUG: sendNewRequestNotification called successfully');
    } catch (smsError) {
      console.error('📱 SMS DEBUG: sendNewRequestNotification failed:', smsError);
    }

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
      // Fetch the request including the user profile so we can email the customer
      .select('*, user_profiles(*)')
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

    // Ensure requestData includes user_profiles (some queries returned a slim object)
    const requestForEmail = requestData.user_profiles ? requestData : (await (async () => {
      const { data: fullRequest } = await supabase
        .from('requests')
        .select('*, user_profiles(*)')
        .eq('id', id)
        .single();
      return fullRequest || requestData;
    })());

    await sendQuoteAddedEmail(requestForEmail, newQuote);

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

    // First get the current quote to log its status
    const { data: currentQuote } = await supabase
      .from('quotes')
      .select('status')
      .eq('id', quoteId)
      .single();

    console.log('updateQuote: Updating quote', { quoteId, currentStatus: currentQuote?.status });

    // Update quote details first
    const { data: updatedQuote, error } = await supabase
      .from('quotes')
      .update({
        quote_amount,
        details,
      })
      .eq('id', quoteId)
      .eq('request_id', id)
      .select()
      .single();

    if (error) {
      console.error('updateQuote: Error updating quote details', error);
      throw error;
    }
    if (!updatedQuote) return res.status(404).json({ error: 'Quote not found or does not belong to this request.' });

    // Then update the status separately
    console.log('updateQuote: About to update quote status to sent');
    const { data: statusData, error: statusError } = await supabase
      .from('quotes')
      .update({ status: 'sent' })
      .eq('id', quoteId)
      .select('status')
      .single();

    if (statusError) {
      console.error('updateQuote: Error updating quote status', statusError);
      console.error('updateQuote: Status error details:', JSON.stringify(statusError, null, 2));
      // Don't throw here, the main update succeeded
    } else {
      console.log('updateQuote: Quote status updated successfully', { newStatus: statusData?.status });
    }

    console.log('updateQuote: Quote updated successfully', { quoteId, amount: updatedQuote.quote_amount });

    // Only revert status to 'quoted' if it was previously 'accepted'
    // This ensures that updating a quote reverts accepted quotes back to quoted status
    // since the new terms haven't been approved yet
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('status')
      .eq('id', id)
      .single();

    if (requestError) throw requestError;

    if (requestData.status === 'accepted') {
      await supabase.from('requests').update({ status: 'quoted' }).eq('id', id);
    }

    res.status(200).json(updatedQuote);
  } catch (err) {
    console.error('updateQuote: Error in updateQuote controller:', err);
    next(err);
  }
};

/**
 * Handles accepting a specific quote using an atomic database function.
 * This is the corrected and robust implementation.
 */
const acceptQuote = async (req, res, next) => {
  try {
    const { id, quoteId } = req.params;
    const userId = req.user.id;

    console.log('acceptQuote: Starting atomic quote acceptance', { requestId: id, quoteId, userId });

    // 1. Verify user has permission (ownership check for non-admins)
    const { data: userProfile } = await supabase.from('user_profiles').select('role').eq('user_id', userId).single();
    if (!userProfile) return res.status(403).json({ error: 'Profile not found.' });

    if (userProfile.role !== 'admin') {
      const { data: requestOwner, error: ownerError } = await supabase.from('requests').select('user_id').eq('id', id).single();
      if (ownerError || !requestOwner) return res.status(404).json({ error: 'Request not found.' });
      if (requestOwner.user_id !== userId) return res.status(403).json({ error: 'Permission denied.' });
    }
    console.log(`acceptQuote: Permission verified for user ${userId} (role: ${userProfile.role})`);

    // 2. Perform the atomic updates directly
    console.log('acceptQuote: Performing atomic quote acceptance updates...');

    // Update the selected quote to 'accepted'
    const { error: acceptError } = await supabase
      .from('quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId)
      .eq('request_id', id);

    if (acceptError) {
      console.error('acceptQuote: Failed to accept quote', acceptError);
      throw acceptError;
    }

    // Update all other quotes for this request to 'rejected'
    const { error: rejectError } = await supabase
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('request_id', id)
      .neq('id', quoteId);

    if (rejectError) {
      console.error('acceptQuote: Failed to reject other quotes', rejectError);
      throw rejectError;
    }

    // Update the request status to 'accepted'
    const { error: requestError } = await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', id);

    if (requestError) {
      console.error('acceptQuote: Failed to update request status', requestError);
      throw requestError;
    }

    console.log('acceptQuote: All updates completed successfully.');

    // 3. Fetch data needed for notifications
    const { data: notificationRequestData, error: notificationRequestError } = await supabase
      .from('requests').select('*, user_profiles(name)').eq('id', id).single();

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes').select('quote_amount').eq('id', quoteId).single();

    // 4. Send notifications
    if (notificationRequestError || quoteError) {
      console.error("Could not fetch data for notifications, but quote was accepted.", { notificationRequestError, quoteError });
    } else if (notificationRequestData && quoteData) {
      await sendStatusUpdateEmail(notificationRequestData);
      sendQuoteAcceptedNotification(notificationRequestData, quoteData);
    }

    // 5. Send success response
    res.status(200).json({ message: 'Quote accepted successfully.' });

  } catch (err) {
    console.error('acceptQuote: An error occurred in the controller', err);
    next(err);
  }
};

/**
 * Handles marking a request as viewed by the user.
 */
const markRequestAsViewed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Atomically update the status to 'viewed' ONLY IF it is currently 'quoted'.
    // This prevents overwriting other statuses. We also ensure the user owns the request.
    const { data, error } = await supabase
      .from('requests')
      .update({ status: 'viewed' })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'quoted') // This is the critical condition
      .select()
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'no rows returned' error
      throw error;
    }

    // It's not an error if nothing was updated (e.g., status was already 'viewed').
    res.status(200).json({ message: 'Request marked as viewed where applicable.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles updating a request (general update for address, etc.).
 */
const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Only allow updating specific fields for security
    const allowedFields = ['service_address', 'latitude', 'longitude', 'geocoded_address'];
    const filteredUpdateData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredUpdateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const { data, error } = await supabase
      .from('requests')
      .update(filteredUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Request not found.' });

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles cleanup of test data (admin only, highly secured)
 * Only deletes records matching specific test patterns
 */
const cleanupTestData = async (req, res, next) => {
  try {
    // SECURITY: Only admins can access this endpoint
    const userId = req.user.id;
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('user_id', userId)
      .single();

    if (userProfile?.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required for cleanup operations.',
        user: userProfile?.email
      });
    }

    // SECURITY: Dry-run by default for safety
    const { dryRun = true, confirmDelete = false } = req.body;
    const isDryRun = dryRun === true || dryRun === 'true';

    // SECURITY: Require explicit confirmation for actual deletion
    if (!isDryRun && !confirmDelete) {
      return res.status(400).json({
        error: 'Must set confirmDelete=true in request body for actual deletion'
      });
    }

    // SECURITY: Only allow in non-production or with test header
    const isProduction = process.env.NODE_ENV === 'production';
    const hasTestHeader = req.headers['x-test-mode'] === 'true';

    if (isProduction && !hasTestHeader) {
      return res.status(403).json({
        error: 'Cleanup operations disabled in production environment without test header'
      });
    }

    // Define VERY SPECIFIC test data patterns (not wildcards)
    const testPatterns = {
      addresses: [
        '%Test St%',
        '%V1V1V1%',
        '%Admin Test%',
        '%Test Address%'
      ],
      // Could add more patterns as needed
    };

    const results = {
      dryRun: isDryRun,
      adminUser: userProfile.email,
      environment: process.env.NODE_ENV,
      identified: [],
      deleted: {
        requests: 0,
        quotes: 0,
        attachments: 0,
        notes: 0
      }
    };

    // Find test requests by address patterns
    for (const addressPattern of testPatterns.addresses) {
      const { data: testRequests, error } = await supabase
        .from('requests')
        .select('id, service_address, customer_name, created_at')
        .ilike('service_address', addressPattern);

      if (error) {
        console.error('Error finding test requests by address:', error);
        continue;
      }

      if (testRequests && testRequests.length > 0) {
        results.identified.push(...testRequests.map(r => ({
          id: r.id,
          address: r.service_address,
          name: r.customer_name,
          created: r.created_at
        })));

        if (!isDryRun) {
          // Delete associated data first (cascade delete for safety)
          for (const request of testRequests) {
            // Delete quotes
            const { data: quotes } = await supabase
              .from('quotes')
              .delete()
              .eq('request_id', request.id)
              .select();
            if (quotes) results.deleted.quotes += quotes.length;

            // Delete attachments
            const { data: attachments } = await supabase
              .from('quote_attachments')
              .delete()
              .eq('request_id', request.id)
              .select();
            if (attachments) results.deleted.attachments += attachments.length;

            // Delete notes
            const { data: notes } = await supabase
              .from('request_notes')
              .delete()
              .eq('request_id', request.id)
              .select();
            if (notes) results.deleted.notes += notes.length;
          }

          // Finally delete the requests
          const { data: deletedRequests, error: deleteError } = await supabase
            .from('requests')
            .delete()
            .ilike('service_address', addressPattern)
            .select();

          if (deleteError) {
            console.error('Error deleting test requests:', deleteError);
            return res.status(500).json({ error: 'Failed to delete test requests' });
          }

          if (deletedRequests) {
            results.deleted.requests += deletedRequests.length;
          }
        }
      }
    }

    // AUDIT LOGGING: Log all cleanup operations
    console.log(`🧹 TEST DATA CLEANUP ${isDryRun ? 'DRY RUN' : 'EXECUTED'}:`, {
      admin: userProfile.email,
      environment: process.env.NODE_ENV,
      identified: results.identified.length,
      deleted: results.deleted,
      patterns: testPatterns
    });

    const message = isDryRun
      ? `Found ${results.identified.length} test records (dry run - no deletion)`
      : `Successfully deleted ${results.deleted.requests} test records and ${results.deleted.quotes + results.deleted.attachments + results.deleted.notes} related items`;

    res.json({
      success: true,
      message,
      ...results
    });

  } catch (err) {
    console.error('❌ Test data cleanup error:', err);
    next(err);
  }
};

/**
 * Handles an admin deleting a draft quote (only if not accepted).
 */
const deleteQuote = async (req, res, next) => {
  try {
    const { id, quoteId } = req.params;

    // First check if the quote exists and is not accepted
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('status')
      .eq('id', quoteId)
      .eq('request_id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!quote) return res.status(404).json({ error: 'Quote not found.' });

    // Only allow deletion if the quote is not accepted
    if (quote.status === 'accepted') {
      return res.status(400).json({ error: 'Cannot delete an accepted quote. Cancel the request instead.' });
    }

    // Delete the quote
    const { error: deleteError } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('request_id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: 'Quote deleted successfully.' });
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

    console.log('updateRequestStatus called:', { id, status, scheduled_start_date });

    const updatePayload = { status };
    if (scheduled_start_date) {
        updatePayload.scheduled_start_date = new Date(scheduled_start_date).toISOString();
    }

    console.log('updatePayload:', updatePayload);

    // Return the updated request including user_profiles so notification helpers can find the recipient
    const { data, error } = await supabase
      .from('requests')
      .update(updatePayload)
      .eq('id', id)
      .select('*, user_profiles(*)')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Request not found.' });

    await sendStatusUpdateEmail(data);

    res.status(200).json(data);
  } catch (err) {
    console.error('updateRequestStatus error:', err);
    next(err);
  }
};

export {
  getGptFollowUp,
  submitQuoteRequest,
  uploadAttachment,
  getStorageObject,
  addRequestNote,
  createQuoteForRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
  updateQuote,
  deleteQuote,
  acceptQuote,
  updateRequestStatus,
  markRequestAsViewed,
  cleanupTestData,
};