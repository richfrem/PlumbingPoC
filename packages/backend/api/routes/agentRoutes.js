// packages/backend/api/routes/agentRoutes.js
// Routes for OpenAI Agent Toolkit integration

import express from 'express';
import { submitQuoteRequest } from '../controllers/requestController.js';
import { updateRequestTriage } from '../controllers/triageController.js';
import { logger } from '../../src/lib/logger.js';

const router = express.Router();

// Temporary local development proxy - calls Netlify function directly
// TODO: Remove this when using Netlify Dev for local development
router.post('/quote/run', async (req, res) => {
  try {
    // Dynamically import the Netlify function handler
    const { handler } = await import('../../netlify/functions/quote-agent.mjs');

    // Transform Express request to Netlify function event format
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: req.headers
    };

    // Call the handler
    const result = await handler(event, {});

    // Send response
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Quote agent proxy error:', error);
    res.status(500).json({ error: 'Agent execution failed', details: error.message });
  }
});

// Agent action: Submit quote request
router.post('/submit-quote', async (req, res) => {
  try {
    logger.log('Agent submitting quote request:', req.body);

    // Transform agent data to match our API format
    const requestData = {
      clarifyingAnswers: req.body.clarifyingAnswers || [],
      contactInfo: req.body.contactInfo || {},
      category: req.body.category || '',
      isEmergency: req.body.isEmergency || false,
      problem_description: req.body.problem_description || '',
      preferred_timing: req.body.preferred_timing || '',
      property_type: req.body.property_type || '',
      is_homeowner: req.body.is_homeowner || false,
      service_address: req.body.service_address || '',
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null,
      geocoded_address: req.body.geocoded_address || null
    };

    // Use existing controller logic
    const result = await submitQuoteRequest(req.body.userId, requestData);

    res.json({
      success: true,
      requestId: result.request?.id,
      message: 'Quote request submitted successfully'
    });
  } catch (error) {
    console.error('Agent quote submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quote request'
    });
  }
});

// Agent action: Update request triage
router.post('/update-triage/:requestId', async (req, res) => {
  try {
    logger.log('Agent updating triage for request:', req.params.requestId, req.body);

    const triageData = {
      triage_summary: req.body.triage_summary,
      priority_score: req.body.priority_score,
      priority_explanation: req.body.priority_explanation,
      profitability_score: req.body.profitability_score,
      profitability_explanation: req.body.profitability_explanation
    };

    await updateRequestTriage(req.params.requestId, triageData);

    res.json({
      success: true,
      message: 'Triage updated successfully'
    });
  } catch (error) {
    console.error('Agent triage update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update triage'
    });
  }
});

// Agent action: Fetch request details
router.get('/request/:requestId', async (req, res) => {
  try {
    // This would use existing request fetching logic
    // For now, return mock data for agent testing
    res.json({
      id: req.params.requestId,
      problem_category: 'leak_repair',
      answers: [
        { question: 'Where is the leak?', answer: 'Under the kitchen sink' },
        { question: 'Is water actively leaking?', answer: 'Yes' }
      ],
      is_emergency: false,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent request fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request'
    });
  }
});

// Agent tool: Assess leak severity
router.post('/tools/assess-leak-severity', async (req, res) => {
  try {
    const { leak_description, drip_rate } = req.body;

    const severity = drip_rate?.includes('steady stream') ? 'high' :
                   drip_rate?.includes('drip') ? 'medium' : 'low';

    res.json({
      severity,
      urgency: severity === 'high' ? 'immediate' : severity === 'medium' ? 'within 24 hours' : 'schedule soon',
      estimated_cost_range: severity === 'high' ? '$200-500' : severity === 'medium' ? '$100-300' : '$50-150'
    });
  } catch (error) {
    console.error('Leak assessment tool error:', error);
    res.status(500).json({ error: 'Tool execution failed' });
  }
});

// Agent tool: Check emergency status
router.post('/tools/check-emergency-status', async (req, res) => {
  try {
    const { leak_location, water_flow, property_type } = req.body;

    const isEmergency = water_flow.includes('actively') ||
                      leak_location.includes('ceiling') ||
                      leak_location.includes('wall');

    res.json({
      is_emergency: isEmergency,
      recommended_response_time: isEmergency ? 'within 2 hours' : 'schedule appointment',
      reason: isEmergency ? 'Risk of significant water damage' : 'Can be scheduled normally'
    });
  } catch (error) {
    console.error('Emergency check tool error:', error);
    res.status(500).json({ error: 'Tool execution failed' });
  }
});

// Agent tool: Analyze water heater issues
router.post('/tools/analyze-water-heater-issue', async (req, res) => {
  try {
    const { symptoms, system_age, system_type } = req.body;

    const age = system_age || 0;
    const shouldReplace = age > 10 || symptoms.includes('no hot water') || symptoms.includes('leaking');

    res.json({
      recommended_action: shouldReplace ? 'replacement' : 'repair',
      estimated_cost: shouldReplace ? '$800-2500' : '$200-800',
      reasoning: shouldReplace ?
        'Age and symptoms suggest replacement is more cost-effective' :
        'Issue appears repairable for now'
    });
  } catch (error) {
    console.error('Water heater analysis tool error:', error);
    res.status(500).json({ error: 'Tool execution failed' });
  }
});

export default router;
