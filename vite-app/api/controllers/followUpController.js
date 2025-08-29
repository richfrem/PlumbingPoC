// vite-app/api/controllers/followUpController.js

const { supabase } = require('../config/supabase');
const { sendFollowUpEmail } = require('../services/emailService');

const sendFollowUpEmails = async (req, res) => {
  try {
    // 1. Fetch all requests with 'quoted' status
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select('*, user_profiles(*)')
      .eq('status', 'quoted');

    if (requestsError) throw requestsError;

    // 2. Filter requests that need a follow-up
    const requestsToFollowUp = requests.filter(request => {
      if (!request.last_follow_up_sent_at) {
        return true; // Send if never sent before
      }

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const lastSent = new Date(request.last_follow_up_sent_at);

      return lastSent < threeDaysAgo;
    });

    // 3. Send follow-up emails
    for (const request of requestsToFollowUp) {
      await sendFollowUpEmail(request);

      // 4. Update the last_follow_up_sent_at timestamp
      await supabase
        .from('requests')
        .update({ last_follow_up_sent_at: new Date() })
        .eq('id', request.id);
    }

    res.status(200).json({ message: `Follow-up emails sent to ${requestsToFollowUp.length} customers.` });
  } catch (error) {
    console.error('Error sending follow-up emails:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { sendFollowUpEmails };
