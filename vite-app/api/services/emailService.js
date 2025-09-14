// vite-app/api/services/emailService.js

const { Resend } = require('resend');

// IMPORTANT: This assumes RESEND_API_KEY, BASE_URL, RESEND_ENABLED, and RESEND_FROM_EMAIL are loaded into your environment variables.
// You may need to install and configure dotenv if you haven't already.
const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.VITE_BACKEND_BASE_URL || 'http://process.env.BACKEND_BASE_URL'; // Fallback for development
const RESEND_ENABLED = process.env.RESEND_ENABLED === 'true'; // Convert to boolean
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Plumbing Co <onboarding@resend.dev>'; // Configurable from address

/**
 * A generic email sending function.
 * NOTE: You must configure a verified domain with Resend to send emails to arbitrary recipients.
 * For testing with an unverified domain, the 'to' address must be your verified Resend account email.
 */
const sendEmail = async ({ to, subject, html }) => {
  console.log(`📧 EMAIL DEBUG: RESEND_ENABLED = ${RESEND_ENABLED}`);
  console.log(`📧 EMAIL DEBUG: Attempting to send email to: ${to}`);
  console.log(`📧 EMAIL DEBUG: Subject: ${subject}`);

  if (!RESEND_ENABLED) {
    console.log('❌ EMAIL DISABLED: Resend is disabled. Email not sent.');
    return { data: { message: 'Resend disabled' } };
  }

  try {
    console.log('📤 EMAIL DEBUG: Calling Resend API...');
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL, // Use configurable from address
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ EMAIL ERROR: Resend Error:', error);
      return { error };
    }

    console.log('✅ EMAIL SUCCESS: Email sent successfully:', data);
    return { data };
  } catch (error) {
    console.error('❌ EMAIL FAILED: Failed to send email:', error);
    return { error };
  }
};

const getRecipientEmail = (request) => {
  // In a real app, you would have more robust logic to get the customer's email.
  // This is a simplified example.
  return request?.user_profiles?.email;
}

const getRequestUrl = (requestId) => {
  return `${BASE_URL}`; // Link to main page for better mobile experience
}

const sendRequestSubmittedEmail = (request) => {
  const recipientEmail = getRecipientEmail(request);
  if (!recipientEmail) return;

  const requestUrl = getRequestUrl(request.id);
  const subject = `Your request has been received!`;
  const html = `<h1>Thank you for your request!</h1><p>We have received your request for "${request.problem_category.replace(/_/g, ' ')}" and will be in touch shortly.</p><p>Request ID: ${request.id}</p><p><a href="${requestUrl}">View your request here</a></p>`;
  
  return sendEmail({ to: recipientEmail, subject, html });
};

const sendStatusUpdateEmail = (request) => {
  const recipientEmail = getRecipientEmail(request);
  if (!recipientEmail) return;

  const requestUrl = getRequestUrl(request.id);
  const subject = `Update on your request`;
  const html = `<p>The status of your request has been updated to: <strong>${request.status}</strong>.</p><p>Request ID: ${request.id}</p><p><a href="${requestUrl}">View your request here</a></p>`;

  return sendEmail({ to: recipientEmail, subject, html });
};

const sendQuoteAddedEmail = (request, quote) => {
    const recipientEmail = getRecipientEmail(request);
    if (!recipientEmail) return;

    const requestUrl = getRequestUrl(request.id);
    const subject = `You have a new quote for your request`;
    const html = `<p>A new quote for <strong>${quote.quote_amount.toFixed(2)}</strong> has been added to your request. Please log in to your portal to view the details.</p><p>Request ID: ${request.id}</p><p><a href="${requestUrl}">View your request here</a></p>`;

    return sendEmail({ to: recipientEmail, subject, html });
};

const sendFollowUpEmail = (request) => {
  const recipientEmail = getRecipientEmail(request);
  if (!recipientEmail) return;

  const requestUrl = getRequestUrl(request.id);
  const subject = `Following up on your quote for ${request.problem_category.replace(/_/g, ' ')}`;
  const html = `<p>Hi ${request.user_profiles?.name || 'there'},</p><p>Just wanted to follow up on the quote we sent you for your recent request. Please let us know if you have any questions or if you'd like to move forward.</p><p>Request ID: ${request.id}</p><p><a href="${requestUrl}">View your request here</a></p>`;

  return sendEmail({ to: recipientEmail, subject, html });
};


module.exports = {
  sendRequestSubmittedEmail,
  sendStatusUpdateEmail,
  sendQuoteAddedEmail,
  sendFollowUpEmail,
};
