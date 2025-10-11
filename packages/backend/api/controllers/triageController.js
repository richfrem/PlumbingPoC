// packages/backend/api/controllers/triageController.js

import { database as supabase } from '../config/supabase/index.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 2. Prepare the prompt for GPT-4
    const prompt = `
      A new plumbing service request has been submitted. Please analyze the following details and provide a triage summary, a priority score (1-10), and a profitability score (1-10).

      Problem Category: ${request.problem_category}
      Answers:
      ${request.answers.map(a => `- ${a.question}: ${a.answer}`).join('\n')}

      Based on the information provided, please return a JSON object with five keys:
      - "triage_summary": A one-sentence summary of the request, highlighting urgency and potential job value.
      - "priority_score": An integer from 1 to 10, where 10 is the highest priority.
      - "priority_explanation": A one-sentence explanation for the priority score.
      - "profitability_score": An integer from 1 to 10, where 10 is the highest profitability. Consider factors like potential job size, complexity, and likelihood of customer conversion.
      - "profitability_explanation": A one-sentence explanation for the profitability score.
    `;

    // 3. Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [{
        role: 'user',
        content: prompt
      }],
      response_format: {
        type: 'json_object'
      },
    });

    const {triage_summary, priority_score, priority_explanation, profitability_score, profitability_explanation} = JSON.parse(response.choices[0].message.content);

    // 4. Update the request in the database
    const {error: updateError} = await supabase
      .from('requests')
      .update({
        triage_summary,
        priority_score,
        priority_explanation,
        profitability_score,
        profitability_explanation
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    res.status(200).json({
      message: 'Triage complete.',
      triage_summary,
      priority_score,
      priority_explanation,
      profitability_score,
      profitability_explanation
    });
  } catch (error) {
    console.error('Error during triage:', error);
    res.status(500).json({
      message: 'Internal Server Error'
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
