// packages/backend/api/services/smsService.js

import axios from 'axios';
import supabase from '../config/supabase.js';
import twilio from 'twilio';


// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Fetches phone numbers for all users with the 'admin' role from Supabase.
// Automatically formats phone numbers to E.164 format for Twilio.
const getAdminPhoneNumbers = async () => {
  console.log('📱 SMS SERVICE: getAdminPhoneNumbers called');

  // Use a more efficient query that gets unique phone numbers directly
  // This simulates: SELECT DISTINCT phone FROM user_profiles WHERE role='admin' AND phone IS NOT NULL
  const { data, error } = await supabase
    .from('user_profiles')
    .select('phone')
    .eq('role', 'admin')
    .not('phone', 'is', null)
    .order('phone'); // Order by phone to group duplicates together

  console.log('📱 SMS SERVICE: Database query result:', { data, error });

  if (error) {
    console.error('❌ SMS Service: Database error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('📱 SMS SERVICE: No admin users with phone numbers found in database');
    return [];
  }

  console.log('📱 SMS SERVICE: Found', data.length, 'admin users with phones');

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

  // FEATURE FLAG: Only send SMS in production (Netlify) environment
  // This prevents accidental SMS sending during local development
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';
  if (!isProduction) {
    console.log('📱 SMS SKIPPED: SMS sending disabled in development environment');
    console.log('📱 SMS SKIPPED: To prevent accidental costs during development');
    console.log('📱 SMS SKIPPED: SMS would have been sent to:', to);
    console.log('📱 SMS SKIPPED: Message preview:', body.substring(0, 50) + '...');
    return;
  }

  if (!accountSid || !authToken || !fromPhone) {
    console.error('❌ SMS ERROR: Twilio credentials not configured');
    console.error('❌ SMS ERROR: accountSid:', !!accountSid);
    console.error('❌ SMS ERROR: authToken:', !!authToken);
    console.error('❌ SMS ERROR: fromPhone:', !!fromPhone);
    return;
  }

  try {
    console.log('📤 SMS DEBUG: About to create Twilio client...');
    // Create Twilio client
    const twilioClient = twilio(accountSid, authToken);
    console.log('📤 SMS DEBUG: Twilio client created successfully');

    console.log('📤 SMS DEBUG: About to call Twilio API...');
    console.log('📤 SMS DEBUG: To:', to);
    console.log('📤 SMS DEBUG: From:', fromPhone);
    console.log('📤 SMS DEBUG: Body length:', body.length);

    // Send SMS directly
    const smsResponse = await twilioClient.messages.create({
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
export const sendNewRequestNotification = async (request) => {
  console.log('📱 SMS SERVICE: sendNewRequestNotification called');
  console.log('📱 SMS SERVICE: Request ID:', request.id);
  console.log('📱 SMS SERVICE: Request data structure:', JSON.stringify(request, null, 2));
  console.log('📱 SMS SERVICE: customer_name:', request.customer_name);
  console.log('📱 SMS SERVICE: user_profiles:', request.user_profiles);

  // DEBUG: Check environment
  console.log('📱 SMS SERVICE: NODE_ENV:', process.env.NODE_ENV);
  console.log('📱 SMS SERVICE: NETLIFY:', process.env.NETLIFY);
  console.log('📱 SMS SERVICE: isProduction check:', process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true');

  // DEBUG: Check Twilio credentials
  console.log('📱 SMS SERVICE: TWILIO_ACCOUNT_SID present:', !!process.env.TWILIO_ACCOUNT_SID);
  console.log('📱 SMS SERVICE: TWILIO_AUTH_TOKEN present:', !!process.env.TWILIO_AUTH_TOKEN);
  console.log('📱 SMS SERVICE: TWILIO_PHONE_NUMBER present:', !!process.env.TWILIO_PHONE_NUMBER);
  console.log('📱 SMS SERVICE: TWILIO_DEFAULT_ADMIN_NUMBER:', process.env.TWILIO_DEFAULT_ADMIN_NUMBER);

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

  const requestUrl = `${process.env.VITE_FRONTEND_BASE_URL}`;
  console.log('📱 SMS SERVICE: Constructing message...');
  console.log('📱 SMS SERVICE: request.id:', request.id);
  console.log('📱 SMS SERVICE: request.problem_category:', request.problem_category);
  console.log('📱 SMS SERVICE: request.customer_name:', request.customer_name);
  console.log('📱 SMS SERVICE: request.service_address:', request.service_address);
  console.log('📱 SMS SERVICE: requestUrl:', requestUrl);

  const messageBody = `New Quote Request!\nID: ${request.id}\nType: ${request.problem_category.replace(/_/g, " ")}\nFrom: ${request.customer_name}\nAddress: ${request.service_address}\nLink: ${requestUrl}`;
  console.log('📱 SMS SERVICE: Message body constructed:', messageBody.substring(0, 50) + '...');
  console.log('📱 SMS SERVICE: Message body length:', messageBody.length);

  console.log('📱 SMS SERVICE: About to call triggerSms...');
  numbersToNotify.forEach((number, index) => {
    console.log(`📱 SMS SERVICE: Calling triggerSms for number ${index + 1}: ${number}`);
    triggerSms(number, messageBody);
  });
  console.log('📱 SMS SERVICE: All triggerSms calls completed');
};

// SCENARIO 2: Quote Accepted by Customer
export const sendQuoteAcceptedNotification = async (request, acceptedQuote) => {
  console.log('📱 SMS SERVICE: sendQuoteAcceptedNotification called');
  console.log('📱 SMS SERVICE: Request ID:', request.id);
  console.log('📱 SMS SERVICE: Quote data:', JSON.stringify(acceptedQuote, null, 2));
  console.log('📱 SMS SERVICE: Request data structure:', JSON.stringify(request, null, 2));
  console.log('📱 SMS SERVICE: customer_name:', request.customer_name);
  console.log('📱 SMS SERVICE: user_profiles:', request.user_profiles);

  const adminNumbers = await getAdminPhoneNumbers();
  console.log('📱 SMS SERVICE: Found admin numbers from DB:', adminNumbers);
  if (adminNumbers.length === 0) return;

  const requestUrl = `${process.env.VITE_FRONTEND_BASE_URL}/#/dashboard`;
  const messageBody = `Quote ACCEPTED!\nID: ${request.id}\nAmount: $${acceptedQuote.quote_amount.toFixed(2)}\nFor: ${request.problem_category.replace(/_/g, " ")}\nCustomer: ${request.user_profiles.name}\nLink: ${requestUrl}`;

  adminNumbers.forEach(number => triggerSms(number, messageBody));
};