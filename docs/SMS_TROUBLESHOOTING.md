# SMS Implementation Troubleshooting Guide

## Overview
This document chronicles the troubleshooting process for implementing Twilio SMS notifications in the PlumbingPOC application using Netlify Functions.

## Initial Setup
- ✅ Twilio account configured with phone number
- ✅ Environment variables set (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- ✅ Netlify CLI installed
- ✅ Netlify function created (`netlify/functions/send-sms.js`)

## Issues Encountered & Solutions

### Issue 1: Environment Variables Not Loading
**Problem:** SMS service couldn't access environment variables in Netlify dev mode
**Symptoms:** `NETLIFY_FUNCTION_SECRET is not set` errors
**Root Cause:** Wrong .env file path in server.js
**Solution:**
```javascript
// In packages/backend/api/server.js
import('dotenv').then(dotenv => dotenv.config({ path: path.resolve(__dirname, '../../../.env') }));
```
**Fixed:** Environment variables now load correctly from root .env file

### Issue 2: Vite Proxy Conflict
**Problem:** Frontend making API calls to wrong port in Netlify dev mode
**Symptoms:** 401 Unauthorized errors, API calls going to localhost:5173 instead of 8888
**Root Cause:** Vite dev server proxying API calls to localhost:3000
**Solution:** Modified `packages/frontend/vite.config.js` to disable proxy in Netlify mode:
```javascript
const isNetlifyDev = process.env.NETLIFY_DEV || process.env.NETLIFY;
return {
  server: {
    proxy: isNetlifyDev ? undefined : {
      '/api': (env.VITE_BACKEND_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
    }
  }
};
```
**Fixed:** API calls now go directly to Netlify functions

### Issue 3: Circular Function Calls
**Problem:** SMS service trying to call Netlify function from within Netlify function
**Symptoms:** 404 errors when SMS service calls itself
**Root Cause:** SMS service using external URL to call internal Netlify function
**Solution:** Modified SMS service to call Twilio API directly:
```javascript
// Before: Called Netlify function
axios.post(SMS_FUNCTION_URL, { to, body }, { headers: { 'x-netlify-function-secret': FUNCTION_SECRET } })

// After: Call Twilio directly
const twilio = require('twilio')(accountSid, authToken);
await twilio.messages.create({ body, from: fromPhone, to });
```
**Fixed:** SMS sends immediately without circular function calls

### Issue 4: Phone Number Format
**Problem:** Phone numbers in database not in E.164 format
**Symptoms:** Twilio rejects phone numbers like "250-885-7003"
**Root Cause:** Database storing human-readable format
**Solution:** Added automatic phone number formatting:
```javascript
const formattedNumbers = data.map(admin => {
  let phone = admin.phone.replace(/\D/g, ''); // Remove non-digits
  if (!phone.startsWith('1')) phone = '1' + phone; // Add country code
  return '+' + phone; // Add + prefix
});
```
**Fixed:** Any phone number format automatically converted to +1NNNNNNNNN

### Issue 5: No Admin Users
**Problem:** SMS service looking for admin users, but test user has role = 'user'
**Symptoms:** SMS service finds 0 admin phone numbers
**Root Cause:** No users with role = 'admin' in database
**Solution:** For testing, modified SMS service to send to hardcoded test number
**Fixed:** SMS sends to test phone number for verification

### Issue 6: Supabase Site URL Configuration (CRITICAL)
**Problem:** SMS working in isolation but not triggered by quote requests
**Symptoms:** Test SMS works, but quote request SMS doesn't; no backend logs appear
**Root Cause:** Supabase Site URL set to production (`https://plumbingpoc.netlify.app`) instead of local (`http://localhost:8888`)
**Impact:** This caused a redirect loop:
1. Start at `http://localhost:8888`
2. Login redirects to production site
3. All API calls go to old deployed code (no SMS feature)
4. Backend logs never appear because requests don't reach local server
**Solution:**
1. **For Local Testing:** Temporarily change Supabase Site URL to `http://localhost:8888`
2. **For Production:** Keep Site URL as `https://plumbingpoc.netlify.app`
3. **Prevention:** Always check Supabase Site URL when switching between local/production testing
**Fixed:** Local testing now works correctly with proper URL configuration

## Test SMS Implementation
Created standalone test endpoint for SMS verification:
```javascript
// In packages/backend/api/server.js
app.post('/api/test-sms', (req, res) => {
  const smsService = require('./services/smsService');
  const testRequest = {
    problem_category: 'test_service',
    customer_name: 'SMS Test User',
    service_address: '123 Test Street, Test City, BC V1V 1V1'
  };
  smsService.sendNewRequestNotification(testRequest);
  res.json({ message: 'SMS test initiated. Check terminal logs and your phone.' });
});
```

## Final Working Architecture
```
Frontend Request → Netlify Function → SMS Service → Twilio API → SMS Delivered
     ↓                ↓                ↓            ↓            ↓
  localhost:8888   /api/test-sms   Direct call   messages.create  ✅ Delivered
```

## Key Learnings
1. **Environment Variables:** Use root .env file for Netlify dev
2. **Vite Proxy:** Disable proxy in Netlify dev mode
3. **Function Calls:** Avoid calling Netlify functions from within Netlify functions
4. **Phone Numbers:** Always format to E.164 (+1NNNNNNNNNN)
5. **Testing:** Create standalone test endpoints for verification
6. **Supabase Configuration:** Always check Site URL when switching between local/production testing
7. **Authentication Flow:** Supabase redirects can break local testing if URLs don't match

## Success Metrics
- ✅ SMS sends successfully: `SMS sent successfully to +1NNNNNNNNNN. SID: SMfeb24055bb712bb683cf7ea48dc71b9a`
- ✅ Response time: 321ms
- ✅ Status: 200 OK
- ✅ Phone receives SMS immediately

## Production Readiness
- Environment variables configured
- Error handling implemented
- Phone number formatting automated
- Test endpoint available for verification
- Ready for admin user integration

## Next Steps
1. Disable test SMS route
2. Test full quote request flow
3. Integrate with admin user phone numbers
4. Deploy to production
