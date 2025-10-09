# PlumbingPOC: Future Roadmap & High-Value Additions

This document outlines planned and potential feature enhancements for the PlumbingPOC platform. These features are designed to be implemented as part of an ongoing "Automation & Growth Engine" package, transforming the core application into a proactive business tool.

The architecture of the platform (using Netlify Functions and Supabase) makes adding these capabilities straightforward and cost-effective.

---

## 1. ✅ Instant SMS Notifications (COMPLETED)

**Status:** ✅ **IMPLEMENTED & LIVE** - Real-time SMS alerts are now active for administrators.

**Objective:** Provide immediate, high-signal alerts to business owners for critical events, enabling faster response times and competitive advantage.

**Implementation Details:**
*   **Technology:** Twilio API for SMS delivery via secure Netlify Functions.
*   **Architecture:** Decoupled serverless design with Express API triggering SMS through HTTP calls to dedicated Netlify Function.
*   **Security:** Secret-based authentication ensures SMS credentials remain isolated in serverless environment.

**Active Notification Events:**
*   **To Business Owner:**
    *   `INSTANT`: New Quote Request Submitted (includes service type, customer name, address, and dashboard link).
    *   `INSTANT`: Customer Accepts a Quote (includes quote amount, service details, and dashboard link).

**Value Proposition:**
*   **For the Owner:** Win more jobs by being the first to respond to new leads with immediate mobile alerts.
*   **Competitive Advantage:** SMS notifications provide faster response times than competitors relying on email alone.

**Actual Cost:** Very low. For typical volume of 50-100 SMS messages per day, the cost via Twilio is approximately **$15-30 CAD/month**. Netlify Function invocations fall well within the generous free tier.

---

## 2. Automated Follow-up System

**Objective:** Prevent leads from going cold by automatically sending polite follow-up emails for quotes that have not been accepted after a set period.

**Implementation Strategy:**
*   **Technology:** Resend API (already integrated in `packages/backend/api/services/email/resend/client.js`).
*   **Trigger:** A **Netlify Scheduled Function**. This is a special type of function that Netlify can run automatically on a cron schedule (e.g., "every morning at 9 AM").
*   **Logic:** The scheduled function will query the Supabase database for all requests with a `status` of 'quoted' where the quote was sent more than [e.g., 3 days] ago and no follow-up has been sent. It will then loop through the results and send a templated follow-up email.

**Value Proposition:**
*   **For the Owner:** Saves hours of administrative work and captures revenue that would otherwise be lost.

---

## 3. Online Invoice Payments (Stripe Integration)

**Objective:** Streamline the payment process, get paid faster, and provide a professional, modern payment experience for customers.

**Implementation Strategy:**
*   **Technology:** Stripe API for payment processing.
*   **Trigger:** An "Pay Invoice" button would appear in the customer's client portal when a job is marked as 'Completed'.
*   **Logic:**
    1.  A new Netlify Function (`/netlify/functions/create-payment-intent.js`) would be created.
    2.  When the customer clicks "Pay Invoice," the frontend calls this function.
    3.  The function communicates with the Stripe API to create a secure payment session.
    4.  The frontend uses the information from Stripe to render a secure credit card input field (using `Stripe.js`).
    5.  Upon successful payment, a Stripe webhook would hit another Netlify Function (`/netlify/functions/handle-payment-success.js`) to update the invoice status in the Supabase database.

**Value Proposition:**
*   **For the Owner:** Improves cash flow by reducing the time between invoicing and payment.
*   **For the Customer:** A convenient and secure way to pay online.

---

## 4. Business Intelligence & Reporting

**Objective:** Provide the business owner with valuable insights into their operations, helping them understand revenue, job profitability, and customer trends.

**Implementation Strategy:**
*   **Technology:** No new third-party services needed initially.
*   **Logic:** A new, secure API endpoint (e.g., `/api/reports/export`) would be created in the existing Express API. This endpoint would query the Supabase database, aggregate data for a given date range, and generate a downloadable CSV file.

**Key Metrics to Export:**
*   Total number of requests.
*   Conversion rate (quoted vs. accepted).
*   Total revenue from completed jobs.
*   Average job value.
*   Breakdown of job types.

**Value Proposition:**
*   **For the Owner:** Make data-driven decisions to grow the business instead of relying on gut feeling.