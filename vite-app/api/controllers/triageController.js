// vite-app/api/controllers/triageController.js

const {supabase} = require('../config/supabase');
const {
  OpenAI
} = require('openai');

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
      A new plumbing service request has been submitted. Please analyze the following details and provide a triage summary and a priority score (1-10).

      Problem Category: ${request.problem_category}
      Answers:
      ${request.answers.map(a => `- ${a.question}: ${a.answer}`).join('\n')}

      Based on the information provided, please return a JSON object with two keys:
      - "triage_summary": A one-sentence summary of the request, highlighting urgency and potential job value.
      - "priority_score": An integer from 1 to 10, where 10 is the highest priority.
    `;

    // 3. Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: prompt
      }],
      response_format: {
        type: 'json_object'
      },
    });

    const {triage_summary, priority_score} = JSON.parse(response.choices[0].message.content);

    // 4. Update the request in the database
    const {error: updateError} = await supabase
      .from('requests')
      .update({
        triage_summary,
        priority_score
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    res.status(200).json({
      message: 'Triage complete.',
      triage_summary,
      priority_score
    });
  } catch (error) {
    console.error('Error during triage:', error);
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};

module.exports = {triageRequest};
