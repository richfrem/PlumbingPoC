// packages/backend/api/controllers/triageController.js

import { database as supabase } from '../config/supabase/index.js';
import { runTriageAnalysis } from '../agents/triageAgentRunner.js';

const triageRequest = async (req, res) => {
  const {requestId} = req.params;

  try {
    // 1. Fetch the request details
    const {data: request, error: requestError} = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    console.log('[TriageController] Running AI triage analysis for request:', requestId);

    // 2. Use the intelligent triage agent runner
    const analysis = await runTriageAnalysis(request);

    // 3. Update the request in the database
    const {error: updateError} = await supabase
      .from('requests')
      .update({
        triage_summary: analysis.triage_summary,
        priority_score: analysis.priority_score,
        priority_explanation: analysis.priority_explanation,
        profitability_score: analysis.profitability_score,
        profitability_explanation: analysis.profitability_explanation
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    console.log('[TriageController] Triage analysis completed:', {
      requestId,
      priority: analysis.priority_score,
      profitability: analysis.profitability_score
    });

    res.status(200).json({
      message: 'Triage complete.',
      ...analysis
    });
  } catch (error) {
    console.error('[TriageController] Error during triage:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

const updateRequestTriage = async (requestId, triageData) => {
  try {
    const {error: updateError} = await supabase
      .from('requests')
      .update({
        triage_summary: triageData.triage_summary,
        priority_score: triageData.priority_score,
        priority_explanation: triageData.priority_explanation,
        profitability_score: triageData.profitability_score,
        profitability_explanation: triageData.profitability_explanation
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error updating triage:', error);
    throw error;
  }
};

export { triageRequest, updateRequestTriage };
