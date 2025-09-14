// vite-app/api/services/smsService.js
const axios = require('axios');
const supabase = require('../config/supabase');


// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Fetches phone numbers for all users with the 'admin' role from Supabase.
// Automatically formats phone numbers to E.164 format for Twilio.
const getAdminPhoneNumbers = async () => {
  // Use a more efficient query that gets unique phone numbers directly
  // This simulates: SELECT DISTINCT phone FROM user_profiles WHERE role='admin' AND phone IS NOT NULL
  const { data, error } = await supabase
    .from('user_profiles')
    .select('phone')
    .eq('role', 'admin')
    .not('phone', 'is', null)
    .order('phone'); // Order by phone to group duplicates together

  if (error) {
    console.error('❌ SMS Service: Database error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Format phone numbers to E.164 format
  const formattedNumbers = data.map(admin => {
    let phone = admin.phone;

    // Remove all non-digit characters
    phone = phone.replace(/\D/g, '');

    // If it doesn't start with country code, assume North America (+1)
    if (!phone.startsWith('1')) {
      phone = '1' + phone;
    }

    // Add + prefix for E.164 format
    return '+' + phone;
  });

  // Remove duplicates to avoid sending multiple SMS to same number
  const uniqueNumbers = [...new Set(formattedNumbers)];

  return uniqueNumbers;
};

// Makes a direct call to Twilio API to send SMS
const triggerSms = async (to, body) => {
  console.log(`🔍 SMS DEBUG: Attempting to send SMS to: ${to}`);
  console.log(`🔍 SMS DEBUG: From number: ${fromPhone}`);
  console.log(`🔍 SMS DEBUG: Message length: ${body.length} characters`);

  if (!accountSid || !authToken || !fromPhone) {
    console.error('❌ SMS ERROR: Twilio credentials not configured');
    console.error('❌ SMS ERROR: accountSid:', !!accountSid);
    console.error('❌ SMS ERROR: authToken:', !!authToken);
    console.error('❌ SMS ERROR: fromPhone:', !!fromPhone);
    return;
  }

  try {
    // Import Twilio client
    const twilio = require('twilio')(accountSid, authToken);

    console.log('📤 SMS DEBUG: Calling Twilio API...');

    // Send SMS directly
    const smsResponse = await twilio.messages.create({
      body: body,
      from: fromPhone,
      to: to
    });

    console.log(`✅ SMS SUCCESS: Sent to ${to}. SID: ${smsResponse.sid}`);
    console.log(`📊 SMS STATUS: ${smsResponse.status}`);
    console.log(`💰 SMS COST: ${smsResponse.price || 'N/A'}`);
  } catch (error) {
    console.error(`❌ SMS FAILED: To ${to}`);
    console.error(`❌ SMS ERROR:`, error.message);
    console.error(`❌ SMS ERROR CODE:`, error.code);
    console.error(`❌ SMS ERROR STATUS:`, error.status);
  }
};

// SCENARIO 1: New Quote Request
exports.sendNewRequestNotification = async (request) => {
  console.log('📱 SMS SERVICE: sendNewRequestNotification called');
  console.log('📱 SMS SERVICE: Request ID:', request.id);

  // First try to get admin numbers from database
  const adminNumbers = await getAdminPhoneNumbers();
  console.log('📱 SMS SERVICE: Found admin numbers from DB:', adminNumbers);

  let numbersToNotify = adminNumbers;

  // If no admin numbers in DB, use default admin number from env
  if (adminNumbers.length === 0) {
    const defaultAdminNumber = process.env.TWILIO_DEFAULT_ADMIN_NUMBER;
    console.log('📱 SMS SERVICE: No admin numbers in DB, using default:', defaultAdminNumber);
    if (defaultAdminNumber) {
      numbersToNotify = [defaultAdminNumber];
    } else {
      console.log('📱 SMS SERVICE: No default admin number configured, skipping SMS');
      return;
    }
  }

  console.log('📱 SMS SERVICE: Will send SMS to:', numbersToNotify);

  const requestUrl = `${process.env.VITE_FRONTEND_BASE_URL}`;
  const messageBody = `New Quote Request!\nID: ${request.id}\nType: ${request.problem_category.replace(/_/g, " ")}\nFrom: ${request.customer_name}\nAddress: ${request.service_address}\nLink: ${requestUrl}`;

  numbersToNotify.forEach(number => triggerSms(number, messageBody));
};

// SCENARIO 2: Quote Accepted by Customer
exports.sendQuoteAcceptedNotification = async (request, acceptedQuote) => {
  const adminNumbers = await getAdminPhoneNumbers();
  if (adminNumbers.length === 0) return;

  const requestUrl = `${process.env.VITE_FRONTEND_BASE_URL}/#/dashboard`;
  const messageBody = `Quote ACCEPTED!\nID: ${request.id}\nAmount: $${acceptedQuote.quote_amount.toFixed(2)}\nFor: ${request.problem_category.replace(/_/g, " ")}\nCustomer: ${request.user_profiles.name}\nLink: ${requestUrl}`;

  adminNumbers.forEach(number => triggerSms(number, messageBody));
};