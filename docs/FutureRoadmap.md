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

## 3. Invoice Management & Payment System

**Objective:** Bridge the gap between quotes (estimates) and final payment by creating a comprehensive invoicing system that handles real-world job variations, integrates AI-assisted billing, and provides seamless online payment processing.

### Understanding Quote vs Invoice

**Quote (Pre-Work Estimate):**
- Initial estimate based on customer description
- Subject to change upon physical inspection
- Customer acceptance required to proceed
- Example: "Bathroom renovation: $3,500-4,200"

**Invoice (Final Billing):**
- Actual work performed and materials used
- Reflects on-site discoveries and customer-approved changes
- Legally binding payment request
- Example: "Bathroom renovation: $3,800 + Additional valve replacement: $180 = **$3,980 total**"

**Why Both Are Needed:**
- 📊 **Transparency:** Clear audit trail from estimate to final cost
- 💼 **Professionalism:** Industry-standard practice
- 🔍 **Accountability:** Documents scope changes and upsells
- 📈 **Analytics:** Track quote accuracy and margin per job

---

### Phase 1: Manual Invoice Creation (Foundation)

**Status:** ✅ **COMPLETED** (December 2025)

**Implemented Features:**

1. ✅ **"Create Invoice" / "Edit Invoice" / "View Invoice" Buttons** in Request Detail Modal
   - Appears when job status = 'completed' (Create) or 'invoiced' (Edit/View)
   - Modes: create, edit, view with proper access control
   - Located in Request Detail Modal action buttons

2. ✅ **Invoice Builder UI (InvoiceFormModal.tsx)**
   - Itemized line items for labor and materials
   - Dynamic add/remove line items
   - Real-time BC tax calculation (GST 5% on all, PST 7% on materials only)
   - Subtotal + Tax = Total Due with auto-calculation
   - Due date picker
   - Payment method selector
   - Notes field for additional context

3. ✅ **Database Schema**
   ```sql
   invoices table (Enhanced):
   - id (UUID), request_id (FK to requests)
   - line_items (JSONB array with type, description, quantity, unit_price)
   - subtotal, gst_amount, pst_amount, total_amount
   - due_date, payment_method, notes
   - status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
   - paid_at, created_at, updated_at
   ```

4. ✅ **Backend API (invoiceController.js)**
   - POST `/api/requests/:requestId/invoices` - Create invoice
   - GET `/api/invoices/:id` - Get invoice with request data (FK join fixed)
   - PATCH `/api/invoices/:id` - Update invoice (blocks if paid)
   - POST `/api/invoices/:id/mark-paid` - Mark as paid
   - GET `/api/invoices` - List invoices (admin sees all, users see own)
   - Authentication & authorization (admin or request owner)

5. ✅ **Frontend Hook (useInvoiceById)**
   - Follows same pattern as useRequestById for consistency
   - Real-time data loading via TanStack Query
   - Error handling and loading states

6. ✅ **Unified Customer Info Display**
   - CustomerInfoSection component shows customer name, phone, email
   - Service address with edit capability
   - Consistent styling across all modals (quotes, invoices, requests)

**Status Synchronization:**
- ✅ When invoice created: `request.status` → `'invoiced'`
- ⏳ Email delivery pending (Phase 1.5)
- ⏳ PDF generation pending (Phase 1.5)

**Technical Achievements:**
- ✅ Fixed Supabase FK join issues (documented in DEVELOPMENT_ENVIRONMENT_SETUP.md)
- ✅ Proper separation of chip color vs header background color
- ✅ Removed redundant customer name from modal header
- ✅ Invoice data pre-population for edit mode

---

### Phase 1.5: Customer Portal & Payments (Next Up)

**Status:** 🔨 **IN PROGRESS** - Starting Tomorrow

**Implementation Order (Revised):**

**NEXT STEPS (Tomorrow):**

1. **Customer Portal Invoice View** ⏱️ 2-3 hours
   - Create new route: `/invoices/:id` in customer portal
   - Read-only invoice display showing:
     - Customer name, service address
     - Itemized line items (labor/materials)
     - GST/PST tax breakdown
     - Total amount due
     - Due date
   - Clean HTML/React view (no PDF yet)
   - Authorization: customer can only view their own invoices
   - Mobile-responsive design
   - **Purpose:** Foundation for payment button integration

2. **Stripe Test Mode Integration & Payment Testing** ⏱️ 4-5 hours
   - Set up Stripe account in test mode
   - Add environment variables:
     - `STRIPE_TEST_SECRET_KEY`
     - `STRIPE_TEST_PUBLISHABLE_KEY`
   - Backend: Create payment intent endpoint `/api/invoices/:id/create-payment-intent`
   - Backend: Stripe webhook handler `/netlify/functions/stripe-webhook.mjs`
   - Frontend: "Pay Invoice" button in portal (from step 1)
   - Frontend: Stripe Elements integration for card input
   - Test with Stripe test cards:
     - ✅ Success: `4242 4242 4242 4242`
     - ❌ Decline: `4000 0000 0000 0002`
   - End-to-end test:
     - Create invoice → Customer views in portal → Pays with test card → 
     - Webhook fires → `invoice.status` = 'paid' → `request.status` = 'paid' → 
     - Owner receives SMS notification
   - Document test scenarios and results

**LATER (After Payment Works):**

3. **Invoice PDF Generation & Email Delivery** ⏱️ 6-8 hours
   - Library: `react-pdf` or `pdfkit`
   - Professional template with business logo
   - PDF generation endpoint
   - Email delivery via Resend API
   - "Download PDF" button in portal
   - Update `invoice.status` to 'sent' after email delivery

**Total Phase 1.5 Effort:** 12-16 hours

**Rationale for Order:**
- ✅ Faster time to value: customers can pay invoices immediately
- ✅ Payment processing is critical path; PDF is polish
- ✅ Test Stripe integration before adding PDF complexity
- ✅ Portal view provides foundation for both payment and PDF features

---

### Phase 2: AI-Assisted Invoice Generation

**Status:** 🤖 Planned - High Value Add

**Objective:** Use AI to automate invoice creation, suggest line items, and explain quote-to-invoice variances to prevent customer disputes.

**AI Capabilities:**

1. **Smart Invoice Generation from Job Notes**
   - AI reads technician completion notes
   - Example input: "Replaced 3 shut-off valves, 2 hours labor, discovered corroded main line (customer approved repair)"
   - AI generates:
     ```
     Line Items:
     - Labor (2 hours @ $125/hr): $250
     - Shut-off valves (3 @ $45 ea): $135
     - Main line repair (customer-approved): $380
     - Materials & fittings: $75
     Total: $840
     ```

2. **Variance Detection & Explanation**
   - AI compares quote amount vs actual invoice
   - Flags discrepancies > 10%
   - Auto-generates customer-friendly explanations:
     > "During the bathroom renovation, we discovered the main shower valve was also corroded and posed a leak risk. You approved this additional repair on-site for $180. Your original quote was $3,500, and the final invoice is $3,680."

3. **Upsell Itemization**
   - AI identifies work beyond original scope
   - Suggests proper billing codes
   - Recommends explanatory notes
   - Example: "Gas line work" → AI flags: "Requires gas fitter certification, premium rate applies"

4. **Dispute Prevention**
   - AI reviews invoice before sending
   - Flags potential issues:
     - Invoice > 20% over quote without explanation
     - Missing line item descriptions
     - Ambiguous charges
   - Suggests adding clarification notes

5. **Price Optimization**
   - AI analyzes completed jobs database
   - Suggests pricing adjustments based on:
     - Material costs
     - Labor time vs estimate
     - Job complexity vs quote
   - Learns to improve future quote accuracy

**Implementation:**
- New AI agent: `invoice-generator-agent.yaml`
- Uses GPT-4 for itemization and explanation generation
- Reads: job completion notes, original quote, service category
- Outputs: Line items JSON, variance explanation, dispute risk score

**AI Invoice Agent Architecture:**
```yaml
agent: InvoiceGeneratorAgent
nodes:
  - id: analyze_completion
    prompt: "Review technician notes and generate invoice line items"
    output:
      line_items: array
      variance_explanation: string
      dispute_risk_score: integer (1-10)
      recommended_notes: array
```

---

### Phase 3: Stripe Payment Integration

**Status:** 💳 Planned

**Objective:** Streamline payment collection, improve cash flow, and provide modern payment experience.

**Implementation Strategy:**

1. **Stripe Setup**
   - Create Stripe account
   - Add `STRIPE_SECRET_KEY` to Netlify environment variables
   - Install `stripe` npm package

2. **Payment Button in Customer Portal**
   - "Pay Invoice" button appears when `invoice.status = 'sent'`
   - Clicking opens Stripe Checkout modal
   - Supports credit/debit cards, Apple Pay, Google Pay

3. **Backend: Create Payment Intent**
   - New Netlify Function: `/netlify/functions/create-payment-intent.mjs`
   - Receives invoice ID from frontend
   - Calls Stripe API to create payment session
   - Returns client secret to frontend

4. **Frontend: Stripe Checkout**
   - Uses `@stripe/stripe-js` and `@stripe/react-stripe-js`
   - Renders secure credit card input
   - Handles 3D Secure authentication
   - Shows loading states and error handling

5. **Webhook: Payment Success**
   - New Netlify Function: `/netlify/functions/stripe-webhook.mjs`
   - Listens for `payment_intent.succeeded` event
   - Updates database:
     - `invoice.status` → `'paid'`
     - `invoice.paid_at` → timestamp
     - `request.status` → `'paid'` ✅ **Status sync**
   - Sends receipt email via Resend
   - Triggers SMS notification to business owner

6. **Payment Tracking**
   - Admin dashboard shows payment status
   - Overdue invoice alerts (due_date passed)
   - Payment history log

**Security:**
- Stripe webhook signature verification
- Never store credit card numbers (PCI compliance)
- All payments processed through Stripe's secure infrastructure

**Cost:**
- Stripe fee: 2.9% + $0.30 per transaction
- Example: $500 invoice = $14.80 fee
- Owner receives: $485.20

---

### Phase 4: Request Status Lifecycle & Synchronization

**Problem:** Current `request.status` doesn't reflect invoicing/payment states.

**Proposed Enhanced Status Workflow:**

```
new → quoted → accepted → scheduled → in_progress → 
completed → invoiced → paid (OR overdue OR disputed)
```

**New Statuses to Add:**

1. **`invoiced`** - Invoice created and sent to customer
2. **`paid`** - Customer paid invoice (job fully closed)
3. **`overdue`** - Invoice past due date without payment
4. **`disputed`** - Customer contested charges (needs resolution)
5. **`partially_paid`** - Partial payment received (optional)

**Status Synchronization Rules:**

| Invoice Status | Request Status | Action Triggered |
|---------------|---------------|------------------|
| `draft` | `completed` | Invoice being prepared |
| `sent` | `invoiced` | Email sent to customer |
| `paid` | `paid` | ✅ Job complete, send receipt, SMS owner |
| `overdue` | `overdue` | 🔔 Send payment reminder, alert owner |
| `disputed` | `disputed` | 🚨 Flag for owner review, pause collections |
| `cancelled` | `completed` | Return to completed state |

**Implementation:**
- Add database trigger or application logic in `invoiceController.js`
- When `invoice.status` changes → automatically update `request.status`
- Ensures dashboard always shows current state
- Prevents manual status mismatches

**Dashboard Impact:**
- Filter by status: "Show me all overdue invoices"
- Visual indicators: Overdue invoices display in red
- Automated reminders: Cron job sends payment reminders for overdue

---

### Phase 5: AI-Powered Collections & Follow-up

**Status:** 🤖 Future Enhancement

**Smart Payment Reminders:**
- AI analyzes customer payment history
- Personalizes reminder tone (friendly vs firm)
- Suggests optimal reminder timing
- Example: "Customer typically pays within 5 days, send gentle reminder on day 6"

**Dispute Resolution Assistant:**
- AI reads dispute reason
- Suggests resolution strategies
- Drafts response emails
- Recommends partial refunds or adjustments

**Cash Flow Forecasting:**
- AI predicts payment timelines based on historical data
- Alerts owner to potential cash flow gaps
- Recommends follow-up priority (chase high-value overdue invoices first)

---

### Implementation Roadmap

**Phase 1: Foundation (COMPLETED ✅)**
- [x] Design Invoice Builder UI (InvoiceFormModal.tsx)
- [x] Implement itemized line item entry (labor + materials)
- [x] BC tax calculation (GST 5% all, PST 7% materials)
- [x] Basic status sync (invoiced)
- [x] Admin can create/edit/view invoices
- [x] Database schema with request_id FK
- [x] Backend API with proper authentication
- [x] useInvoiceById hook following request pattern
- [x] Unified CustomerInfoSection component
- [x] Fixed Supabase FK join issues

**Phase 1.5: Customer Portal & Payments (IN PROGRESS 🔨 - Tomorrow)**
- [ ] **TOMORROW:** Customer portal invoice view (HTML/React, 2-3 hours)
- [ ] **TOMORROW:** Stripe test mode setup and integration (4-5 hours)
- [ ] **TOMORROW:** Payment button with Stripe Elements
- [ ] **TOMORROW:** Create payment intent endpoint
- [ ] **TOMORROW:** Stripe webhook handler
- [ ] **TOMORROW:** Test payment flow end-to-end
- [ ] **TOMORROW:** Document test scenarios
- [ ] **LATER:** Invoice PDF generation (react-pdf, 6-8 hours)
- [ ] **LATER:** Email invoice to customer (Resend API)
- [ ] **LATER:** Download PDF functionality
- [ ] **LATER:** Update invoice.status to 'sent' automation

**Phase 2: AI Assistance (Planned 🤖)**
- [ ] Build invoice-generator-agent.yaml
- [ ] AI reads completion notes → suggests line items
- [ ] Variance detection and explanation generation
- [ ] Dispute risk scoring
- [ ] Test with historical job data

**Phase 3: Payments (Planned 💳)**
- [ ] Stripe account setup and integration
- [ ] Payment button in customer portal
- [ ] Webhook for payment success
- [ ] Status sync (paid, overdue)
- [ ] Receipt generation and email

**Phase 4-5: Advanced Features (Future 🚀)**
- [ ] Enhanced status workflow implementation
- [ ] Automated overdue reminders
- [ ] Dispute tracking and resolution
- [ ] AI collections assistant
- [ ] Cash flow forecasting dashboard

---

### Value Proposition

**For the Business Owner:**
- ⏱️ **Time Savings:** AI generates invoices in seconds vs 5-10 minutes manually
- 💰 **Faster Payment:** Online payments reduce collection time by 50%
- 📊 **Better Accuracy:** AI flags pricing errors before customer sees them
- 🛡️ **Dispute Prevention:** Clear explanations reduce customer pushback
- 📈 **Improved Cash Flow:** Automated reminders and easy payment increase on-time payments

**For the Customer:**
- 💳 **Convenience:** Pay online 24/7 with credit card
- 📱 **Mobile-Friendly:** Pay from phone, no checks or bank visits
- 🔍 **Transparency:** Itemized invoices show exactly what they're paying for
- ✅ **Trust:** Professional invoicing builds confidence

**Estimated ROI:**
- Average payment cycle reduction: 7-10 days → 2-3 days
- Dispute rate reduction: 15% → 5%
- Admin time savings: 30 minutes/day (5 hours/month)
- Cost to implement: ~40 hours development + Stripe fees (2.9%)
- Break-even: ~20 paid invoices

---

### Technical Architecture

**Database Schema Enhancements Needed:**

```sql
-- Add new request statuses
ALTER TABLE requests 
  ADD CONSTRAINT valid_status 
  CHECK (status IN ('new', 'quoted', 'accepted', 'scheduled', 
                    'in_progress', 'completed', 'invoiced', 
                    'paid', 'overdue', 'disputed', 'cancelled'));

-- Enhance invoices table
ALTER TABLE invoices
  ADD COLUMN line_items JSONB,           -- Array of {description, quantity, unit_price, total}
  ADD COLUMN subtotal NUMERIC(10,2),
  ADD COLUMN tax_rate NUMERIC(5,2),      -- e.g., 0.13 for 13% tax
  ADD COLUMN tax_amount NUMERIC(10,2),
  ADD COLUMN total NUMERIC(10,2),
  ADD COLUMN paid_at TIMESTAMP,
  ADD COLUMN payment_method TEXT,         -- 'stripe', 'check', 'cash', 'etransfer'
  ADD COLUMN stripe_payment_intent_id TEXT,
  ADD COLUMN notes TEXT,                  -- Admin notes or variance explanations
  ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN ai_variance_explanation TEXT;

-- Add invoice_id to requests table for easy lookup
ALTER TABLE requests
  ADD COLUMN invoice_id UUID REFERENCES invoices(id);

-- Indexes for performance
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_requests_invoice_id ON requests(invoice_id);
```

**API Endpoints to Create:**

```javascript
// Invoice Management
POST   /api/invoices/:requestId/create     // Create invoice from completed job
GET    /api/invoices/:invoiceId            // Get invoice details
PUT    /api/invoices/:invoiceId            // Update invoice (edit line items)
POST   /api/invoices/:invoiceId/send       // Send invoice email to customer
DELETE /api/invoices/:invoiceId            // Cancel/delete draft invoice

// AI-Assisted Invoicing
POST   /api/invoices/:requestId/ai-generate // AI generates invoice from job notes
POST   /api/invoices/:invoiceId/ai-explain  // AI explains quote-to-invoice variance

// Payment Processing
POST   /api/invoices/:invoiceId/create-payment-intent  // Stripe payment setup
POST   /api/webhooks/stripe                // Handle payment success webhook

// Collections & Reminders
POST   /api/invoices/:invoiceId/send-reminder  // Manual payment reminder
GET    /api/invoices/overdue                   // List all overdue invoices
POST   /api/invoices/:invoiceId/mark-disputed  // Flag invoice as disputed
```

**Netlify Functions:**

```
netlify/functions/
  invoice-generator-agent.mjs     // AI invoice generation
  create-payment-intent.mjs       // Stripe payment setup
  stripe-webhook.mjs              // Payment success handler
  send-payment-reminder.mjs       // Automated reminder emails
  invoice-overdue-check.mjs       // Scheduled function (daily cron)
```

---

### Success Metrics

**Track & Measure:**
- Average days from job completion → invoice sent (target: < 1 day)
- Average days from invoice sent → payment received (target: < 5 days)
- % of invoices paid within 7 days (target: > 80%)
- % of invoices disputed (target: < 5%)
- % of invoices AI-generated vs manual (target: > 70% AI)
- Invoice-to-quote accuracy (target: < 10% variance)
- Online payment adoption rate (target: > 60%)

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