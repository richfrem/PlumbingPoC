// packages/backend/api/services/email/resend/client.js

import { Resend } from 'resend';
import { database as supabase } from '../../../config/supabase/index.js';

// Load environment variables correctly.
const resend = new Resend(process.env.RESEND_API_KEY);
// This should be the URL of your FRONTEND application.
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const RESEND_ENABLED = process.env.RESEND_ENABLED === 'true';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AquaFlow Plumbing <noreply@copilotfortrades.com>';

/**
 * A generic email sending function.
 */
// requestId is optional but should be provided by callers so audit rows can link to a request
const sendEmail = async ({ to, subject, html, text, requestId = null }) => {
  console.log(`📧 EMAIL DEBUG: RESEND_ENABLED = ${RESEND_ENABLED}`);
  console.log(`📧 EMAIL DEBUG: Attempting to send email from: ${RESEND_FROM_EMAIL}`);
  console.log(`📧 EMAIL DEBUG: Attempting to send email to: ${to}`);
  console.log(`📧 EMAIL DEBUG: Subject: ${subject}`);

  if (!RESEND_ENABLED) {
    console.log('❌ EMAIL DISABLED: Resend is disabled. Email not sent.');
    return { data: { message: 'Resend disabled' } };
  }

  try {
    console.log('📤 EMAIL DEBUG: Calling Resend API...');
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('❌ EMAIL ERROR: Resend Error:', error);
      // Persist failure if possible
      try {
        await supabase.from('email_audit').insert({
          request_id: requestId || null,
          recipient: to,
          resend_message_id: null,
          status: 'error',
          provider_response: error ? JSON.parse(JSON.stringify(error)) : null,
          created_at: new Date().toISOString()
        });
      } catch (persistErr) {
        console.warn('Could not persist email_audit (error):', persistErr?.message || persistErr);
      }
      return { error };
    }

    console.log('✅ EMAIL SUCCESS: Email sent successfully:', data);

    // Persist send audit if supabase is available
    try {
      await supabase.from('email_audit').insert({
        request_id: requestId || null,
        recipient: to,
        resend_message_id: data?.id || null,
        status: 'sent',
        provider_response: data ? data : null,
        created_at: new Date().toISOString()
      });
    } catch (persistErr) {
      console.warn('Could not persist email_audit (success):', persistErr?.message || persistErr);
    }

    return { data };
  } catch (error) {
    console.error('❌ EMAIL FAILED: Failed to send email:', error);
    try {
      await supabase.from('email_audit').insert({
        request_id: requestId || null,
        recipient: to,
        resend_message_id: null,
        status: 'failed',
        provider_response: { message: error?.message || String(error) },
        created_at: new Date().toISOString()
      });
    } catch (persistErr) {
      console.warn('Could not persist email_audit (exception):', persistErr?.message || persistErr);
    }
    return { error };
  }
};

// CRITICAL CHANGE: This now returns the customer's email.
const getRecipientEmail = (request) => {
  // The domain is now verified, so we can send to the actual customer.
  return request?.user_profiles?.email;
};

// RECOMMENDED IMPROVEMENT: Link directly to the request if your frontend supports it.
const getRequestUrl = (requestId) => {
  // Use hash-based route so the SPA can handle the client-side route
  return `${BASE_URL}/#/requests/${requestId}`;
};

const sendRequestSubmittedEmail = (request) => {
  const recipientEmail = getRecipientEmail(request);
  if (!recipientEmail) {
    console.log('📧 EMAIL DEBUG: No recipient email found on request. Aborting sendRequestSubmittedEmail.');
    console.log('📧 EMAIL DEBUG: request.user_profiles =', request?.user_profiles);
    return;
  }

  // Extra debug information to help trace any delivery issues
  console.log('📧 EMAIL DEBUG: Preparing to send request-submitted email');
  console.log('📧 EMAIL DEBUG: RESEND_ENABLED =', RESEND_ENABLED);
  console.log('📧 EMAIL DEBUG: RESEND_FROM_EMAIL =', RESEND_FROM_EMAIL);
  console.log('📧 EMAIL DEBUG: recipientEmail =', recipientEmail);
  console.log('📧 EMAIL DEBUG: request.id =', request?.id);

  const requestUrl = getRequestUrl(request.id);
  const subject = `Your request has been received!`;
  // Build readable fields
  const humanizedCategory = request.problem_category ? request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  const customerName = request.user_profiles?.name || 'N/A';
  const customerEmail = request.user_profiles?.email || 'N/A';
  const customerPhone = request.user_profiles?.phone || 'N/A';
  const serviceAddress = request.service_address || 'N/A';
  const quotesCount = Array.isArray(request.quotes) ? request.quotes.length : 0;
  const triage = request.triage_summary || null;
  const asapFlag = request.asap ? 'Yes' : 'No';
  const scheduled = request.scheduled_date ? new Date(request.scheduled_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (request.asap ? 'ASAP' : 'Not scheduled');
  const rawSummary = request.description || '';
  const htmlSummary = rawSummary.length > 400 ? `${rawSummary.slice(0,400)}…` : rawSummary;

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width:600px; margin:0 auto;">
      <h2 style="color:#111827">We've received your request</h2>
      <p style="color:#374151">Thanks — we've recorded your request for "${humanizedCategory}". Click the button below to view details and manage quotes.</p>
      <p style="text-align:center; margin:24px 0;">
        <a href="${requestUrl}" style="background:#2563eb;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">View request</a>
      </p>

      <h3 style="color:#111827; font-size:16px; margin-top:8px;">Request details</h3>
      <table style="width:100%; font-size:14px; color:#374151; border-collapse:collapse;">
        <tr><td style="padding:6px 0; width:150px; color:#6b7280">Request ID</td><td style="padding:6px 0">${request.id}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280">Summary</td><td style="padding:6px 0">${htmlSummary || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280">Type</td><td style="padding:6px 0">${humanizedCategory}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280">Emergency Request?</td><td style="padding:6px 0">${asapFlag}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280">Scheduled</td><td style="padding:6px 0">${scheduled}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280">Service address</td><td style="padding:6px 0">${serviceAddress}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280">Customer</td><td style="padding:6px 0">${customerName} — ${customerEmail} — ${customerPhone}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280">Quotes</td><td style="padding:6px 0">${quotesCount}</td></tr>
        ${triage ? `<tr><td style="padding:6px 0; color:#6b7280">Triage</td><td style="padding:6px 0">${triage}</td></tr>` : ''}
      </table>

      <p style="font-size:12px;color:#6b7280; margin-top:12px">Or open this link in your browser: <a href="${requestUrl}">${requestUrl}</a></p>
      <hr />
      <p style="color:#374151">Thanks,<br/>Plumbing POC</p>
    </div>
  `;

  const text = `We've received your request for "${humanizedCategory}".

Request ID: ${request.id}
Summary: ${rawSummary}
Type: ${humanizedCategory}
Emergency Request?: ${asapFlag}
Scheduled: ${scheduled}
Service address: ${serviceAddress}
Customer: ${customerName} — ${customerEmail} — ${customerPhone}
Quotes: ${quotesCount}
${triage ? `Triage: ${triage}\n` : ''}

View it here: ${requestUrl}

Thanks,
Plumbing POC`;

  return sendEmail({ to: recipientEmail, subject, html, text, requestId: request.id });
};

const sendStatusUpdateEmail = (request) => {
  const recipientEmail = getRecipientEmail(request);
  if (!recipientEmail) return;

  const requestUrl = getRequestUrl(request.id);
  const subject = `Update on your request`;
  // Shared field formatting
  const humanizedCategory = request.problem_category ? request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  const rawSummary = request.description || '';
  const htmlSummary = rawSummary.length > 300 ? `${rawSummary.slice(0,300)}…` : rawSummary;
  const asapFlag = request.asap ? 'Yes' : 'No';
  const scheduled = request.scheduled_date ? new Date(request.scheduled_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (request.asap ? 'ASAP' : 'Not scheduled');
  const customerName = request.user_profiles?.name || 'N/A';
  const customerPhone = request.user_profiles?.phone || 'N/A';
  const serviceAddress = request.service_address || 'N/A';
  const quotesCount = Array.isArray(request.quotes) ? request.quotes.length : 0;

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width:600px; margin:0 auto;">
      <p style="color:#374151">The status of your request has been updated to: <strong>${request.status}</strong>.</p>
      <p style="text-align:center; margin:16px 0;"><a href="${requestUrl}" style="background:#2563eb;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">View request</a></p>

      <h4 style="margin-top:8px;color:#111827">Request details</h4>
      <p style="color:#374151; font-size:14px; line-height:1.4">${htmlSummary || 'N/A'}</p>
      <p style="color:#6b7280; font-size:13px">Type: ${humanizedCategory} • Emergency: ${asapFlag} • Scheduled: ${scheduled}</p>
      <p style="color:#6b7280; font-size:13px">Address: ${serviceAddress} • Customer: ${customerName} • Phone: ${customerPhone} • Quotes: ${quotesCount}</p>

      <p style="font-size:12px;color:#6b7280; margin-top:12px">Request ID: ${request.id} — or open: <a href="${requestUrl}">${requestUrl}</a></p>
      <hr />
      <p style="color:#374151">Thanks,<br/>Plumbing POC</p>
    </div>
  `;

  const text = `The status of your request has been updated to: ${request.status}\n\nRequest ID: ${request.id}\nSummary: ${rawSummary}\nType: ${humanizedCategory}\nEmergency?: ${asapFlag}\nScheduled: ${scheduled}\nService address: ${serviceAddress}\nCustomer: ${customerName} — ${customerPhone}\nQuotes: ${quotesCount}\n\nView it here: ${requestUrl}\n\nThanks,\nPlumbing POC`;

  return sendEmail({ to: recipientEmail, subject, html, text, requestId: request.id });
};

const sendQuoteAddedEmail = (request, quote) => {
    const recipientEmail = getRecipientEmail(request);
    if (!recipientEmail) return;

    const requestUrl = getRequestUrl(request.id);
    const subject = `You have a new quote for your request`;
    const humanizedCategory = request.problem_category ? request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
    const rawSummary = request.description || '';
    const htmlSummary = rawSummary.length > 300 ? `${rawSummary.slice(0,300)}…` : rawSummary;
    const asapFlag = request.asap ? 'Yes' : 'No';
    const scheduled = request.scheduled_date ? new Date(request.scheduled_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (request.asap ? 'ASAP' : 'Not scheduled');
    const customerName = request.user_profiles?.name || 'N/A';
    const customerPhone = request.user_profiles?.phone || 'N/A';
    const serviceAddress = request.service_address || 'N/A';

    const html = `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width:600px; margin:0 auto;">
        <p style="color:#374151">A new quote for <strong>$${quote.quote_amount.toFixed(2)}</strong> has been added to your request.</p>
        <p style="text-align:center; margin:16px 0;"><a href="${requestUrl}" style="background:#10b981;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">View quote</a></p>

        <h4 style="margin-top:8px;color:#111827">Request details</h4>
        <p style="color:#374151; font-size:14px; line-height:1.4">${htmlSummary || 'N/A'}</p>
        <p style="color:#6b7280; font-size:13px">Type: ${humanizedCategory} • Emergency: ${asapFlag} • Scheduled: ${scheduled}</p>
        <p style="color:#6b7280; font-size:13px">Address: ${serviceAddress} • Customer: ${customerName} • Phone: ${customerPhone}</p>

        <p style="font-size:12px;color:#6b7280; margin-top:12px">Request ID: ${request.id} — or open: <a href="${requestUrl}">${requestUrl}</a></p>
        <hr />
        <p style="color:#374151">Thanks,<br/>Plumbing POC</p>
      </div>
    `;

    const text = `A new quote for $${quote.quote_amount.toFixed(2)} has been added.\n\nRequest ID: ${request.id}\nSummary: ${rawSummary}\nType: ${humanizedCategory}\nEmergency?: ${asapFlag}\nScheduled: ${scheduled}\nService address: ${serviceAddress}\nCustomer: ${customerName} — ${customerPhone}\n\nView it here: ${requestUrl}\n\nThanks,\nPlumbing POC`;

  return sendEmail({ to: recipientEmail, subject, html, text, requestId: request.id });
};

const sendFollowUpEmail = (request) => {
  const recipientEmail = getRecipientEmail(request);
  if (!recipientEmail) return;

  const requestUrl = getRequestUrl(request.id);
  const subject = `Following up on your quote for ${request.problem_category.replace(/_/g, ' ')}`;
  const humanizedCategory = request.problem_category ? request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  const rawSummary = request.description || '';
  const htmlSummary = rawSummary.length > 300 ? `${rawSummary.slice(0,300)}…` : rawSummary;
  const asapFlag = request.asap ? 'Yes' : 'No';
  const scheduled = request.scheduled_date ? new Date(request.scheduled_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (request.asap ? 'ASAP' : 'Not scheduled');
  const customerName = request.user_profiles?.name || 'N/A';
  const customerPhone = request.user_profiles?.phone || 'N/A';
  const serviceAddress = request.service_address || 'N/A';

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width:600px; margin:0 auto;">
      <p style="color:#374151">Hi ${customerName},</p>
      <p style="color:#374151">Just wanted to follow up on the quote we sent you for your recent request. Please let us know if you have any questions or if you'd like to move forward.</p>
      <p style="text-align:center; margin:16px 0;"><a href="${requestUrl}" style="background:#2563eb;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">View request</a></p>

      <h4 style="margin-top:8px;color:#111827">Request details</h4>
      <p style="color:#374151; font-size:14px; line-height:1.4">${htmlSummary || 'N/A'}</p>
      <p style="color:#6b7280; font-size:13px">Type: ${humanizedCategory} • Emergency: ${asapFlag} • Scheduled: ${scheduled}</p>
      <p style="color:#6b7280; font-size:13px">Address: ${serviceAddress} • Customer: ${customerName} • Phone: ${customerPhone}</p>

      <p style="font-size:12px;color:#6b7280; margin-top:12px">Request ID: ${request.id} — or open: <a href="${requestUrl}">${requestUrl}</a></p>
      <hr />
      <p style="color:#374151">Thanks,<br/>Plumbing POC</p>
    </div>
  `;

  const text = `Hi ${customerName},\n\nJust wanted to follow up on the quote we sent you for your recent request.\n\nRequest ID: ${request.id}\nSummary: ${rawSummary}\nType: ${humanizedCategory}\nEmergency?: ${asapFlag}\nScheduled: ${scheduled}\nService address: ${serviceAddress}\nCustomer: ${customerName} — ${customerPhone}\n\nView it here: ${requestUrl}\n\nThanks,\nPlumbing POC`;

  return sendEmail({ to: recipientEmail, subject, html, text, requestId: request.id });
};


export {
  sendRequestSubmittedEmail,
  sendStatusUpdateEmail,
  sendQuoteAddedEmail,
  sendFollowUpEmail,
};
