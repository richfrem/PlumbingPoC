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
  if (!accountSid || !authToken || !fromPhone) {
    console.error('Twilio credentials not configured. Cannot send SMS.');
    return;
  }

  try {
    // Import Twilio client
    const twilio = require('twilio')(accountSid, authToken);

    // Send SMS directly
    const smsResponse = await twilio.messages.create({
      body: body,
      from: fromPhone,
      to: to
    });

    console.log(`SMS sent successfully to ${to}. SID: ${smsResponse.sid}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error.message);
  }
};

// SCENARIO 1: New Quote Request
exports.sendNewRequestNotification = async (request) => {
  // First try to get admin numbers from database
  const adminNumbers = await getAdminPhoneNumbers();

  let numbersToNotify = adminNumbers;

  // If no admin numbers in DB, use default admin number from env
  if (adminNumbers.length === 0) {
    const defaultAdminNumber = process.env.TWILIO_DEFAULT_ADMIN_NUMBER;
    if (defaultAdminNumber) {
      numbersToNotify = [defaultAdminNumber];
    } else {
      return;
    }
  }

  const requestUrl = `${process.env.VITE_FRONTEND_BASE_URL}/#/dashboard`;
  const messageBody = `New Quote Request!\nType: ${request.problem_category.replace(/_/g, " ")}\nFrom: ${request.customer_name}\nAddress: ${request.service_address}\nLink: ${requestUrl}`;

  numbersToNotify.forEach(number => triggerSms(number, messageBody));
};

// SCENARIO 2: Quote Accepted by Customer
exports.sendQuoteAcceptedNotification = async (request, acceptedQuote) => {
  const adminNumbers = await getAdminPhoneNumbers();
  if (adminNumbers.length === 0) return;

  const requestUrl = `${process.env.VITE_FRONTEND_BASE_URL}/#/dashboard`;
  const messageBody = `Quote ACCEPTED!\nAmount: $${acceptedQuote.quote_amount.toFixed(2)}\nFor: ${request.problem_category.replace(/_/g, " ")}\nCustomer: ${request.user_profiles.name}\nLink: ${requestUrl}`;

  adminNumbers.forEach(number => triggerSms(number, messageBody));
};