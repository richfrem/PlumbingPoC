// netlify/functions/send-sms.js

const twilio = require('twilio');

exports.handler = async function(event) {
  // 1. Security Check: Only allow POST requests with the correct secret header.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const providedSecret = event.headers['x-netlify-function-secret'];
  if (providedSecret !== process.env.NETLIFY_FUNCTION_SECRET) {
    console.warn('Unauthorized attempt to trigger SMS function.');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 2. Get Twilio credentials from Netlify environment variables.
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.error('Twilio environment variables are not configured in Netlify.');
    return { statusCode: 500, body: 'SMS service is not configured.' };
  }

  const client = twilio(accountSid, authToken);

  try {
    // 3. Parse the incoming request to get the recipient and message.
    const { to, body } = JSON.parse(event.body);
    if (!to || !body) {
      return { statusCode: 400, body: 'Missing "to" or "body" in request.' };
    }

    // 4. Send the SMS message using Twilio regular messaging.
    const smsResponse = await client.messages.create({
      body: body,
      from: fromPhone,
      to: to, // Must be in E.164 format (e.g., "+12505551234")
    });

    console.log(`SMS sent successfully to ${to}. SID: ${smsResponse.sid}`);
    return { statusCode: 200, body: JSON.stringify({ success: true, sid: smsResponse.sid }) };

  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
};