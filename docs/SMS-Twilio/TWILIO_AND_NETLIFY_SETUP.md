# Twilio & Netlify Setup Guide for SMS Notifications

This guide will walk you through setting up a Twilio account and configuring your Netlify site with the necessary credentials to enable SMS notifications.

---

### **Step 1: Create Your Twilio Account**

1.  Go to the [Twilio website](https://www.twilio.com/try-twilio) and sign up for a free trial account.
2.  Verify your email and phone number as prompted. The number you verify will be the first number you can send test SMS messages to from your trial account.
3.  When asked about your project, you can select choices like "Notifications," "Node.js," and "With code."

---

### **Step 2: Get a Twilio Phone Number**

This is the phone number that your SMS alerts will be sent *from*.

1.  From your Twilio Console Dashboard, look for a button that says **"Get a trial phone number"**.
2.  Click it. Twilio will automatically assign you a phone number with SMS capabilities.
3.  **Copy this phone number** (including the `+` and country code, e.g., `+15551234567`). You will need this later.

---

### **Step 3: Find Your API Credentials**

These are the secret keys that allow your application to securely use your Twilio account.

1.  Go to your main Twilio Console Dashboard.
2.  On the right side of the dashboard, under "Account Info," you will see your **ACCOUNT SID** and **AUTH TOKEN**.
3.  Copy both of these values. **Keep the Auth Token secret like a password.**



---

### **Step 4: Configure Your Netlify Environment Variables**

This is the final and most important step. It securely provides the credentials to your application without exposing them in the code.

1.  Log in to your [Netlify account](https://app.netlify.com/).
2.  Select the site for your PlumbingPOC project.
3.  Go to **Site settings** > **Build & deploy** > **Environment**.
4.  Under "Environment variables," click **"Edit variables"**.
5.  Add the following **four (4)** variables, one by one, using the values you copied from Twilio.

    *   **Variable 1: Account SID**
        *   **Key:** `TWILIO_ACCOUNT_SID`
        *   **Value:** Paste your Account SID here.

    *   **Variable 2: Auth Token**
        *   **Key:** `TWILIO_AUTH_TOKEN`
        *   **Value:** Paste your Auth Token here.

    *   **Variable 3: Twilio Phone Number**
        *   **Key:** `TWILIO_PHONE_NUMBER`
        *   **Value:** Paste your Twilio phone number here (e.g., `+15551234567`).

    *   **Variable 4: Netlify Function Secret**
        *   **Key:** `NETLIFY_FUNCTION_SECRET`
        *   **Value:** Create a long, random, and secret string. This acts like a password to prevent others from triggering your SMS function. You can use a password generator or a random string like `Plumb1ngP0C-S3cr3t-K3y-f0r-SMS-9876`.

6.  Click **"Save"**.

---

### **Setup Complete!**

Your work is now done. Provide this guide and the following technical specification to your developer. They will have everything they need to implement the feature. You may need to redeploy your site for the new environment variables to take effect.
