---
id: 0047
status: in-progress
priority: high
owner: richfrem
estimate: 6 weeks
created: 2024-10-01
links:
  - docs/TASKS.md#long-term-roadmap
acceptance_criteria:
  - Create customer portal invoice view route (/invoices/:id)
  - Implement read-only invoice display with itemized details
  - Add Stripe test mode integration with payment intents
  - Create Stripe webhook handler for payment events
  - Build payment button and Stripe Elements integration
  - Test end-to-end payment flow with status updates
  - Ensure proper authorization (customers see only their invoices)
notes: |
  Phase 1.5 implementation: Customer portal invoice viewing and Stripe payment integration. Includes read-only invoice display, payment processing, and status synchronization.
---

# Invoice Portal & Stripe Payments (Phase 1.5)

## Implementation Order

### NEXT STEPS (High Priority):
1. **Customer Portal Invoice View** (2-3 hours)
   - Create new route: `/invoices/:id` in customer portal
   - Read-only invoice display showing customer name, service address, itemized line items, GST/PST tax breakdown, total due, due date
   - Clean HTML/React view (no PDF yet)
   - Authorization: customer can only view their own invoices
   - Mobile-responsive design

2. **Stripe Test Mode Integration & Payment Testing** (4-5 hours)
   - Set up Stripe account in test mode
   - Add environment variables: `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_PUBLISHABLE_KEY`
   - Backend: Create payment intent endpoint `/api/invoices/:id/create-payment-intent`
   - Backend: Stripe webhook handler `/netlify/functions/stripe-webhook.mjs`
   - Frontend: "Pay Invoice" button in portal with Stripe Elements
   - Test with Stripe test cards (4242 4242 4242 4242 = success, 4000 0000 0000 0002 = decline)
   - End-to-end test: Create invoice → Customer views → Pays → Webhook fires → Status updates

### LATER (After Payment Works):
3. **Invoice PDF Generation & Email Delivery** (6-8 hours)
   - Generate professional PDFs with business logo
   - Email delivery via Resend API
   - "Download PDF" button in portal

## Total Phase 1.5 Effort: 12-16 hours

## Rationale for Order:
- ✅ Faster time to value: customers can pay immediately
- ✅ Payment processing is critical path; PDF is polish
- ✅ Test Stripe before adding PDF complexity
- ✅ Portal provides foundation for both payment and PDF

## Details
- [x] **MOVED:** Stripe account setup and integration - See task 0047
- [x] **MOVED:** Payment button in customer portal - See task 0047
- [x] **MOVED:** Webhook for payment success - See task 0047
- [x] **MOVED:** Status sync (paid, overdue) - See task 0047
- [x] **MOVED:** Receipt generation and email - See task 0047
- [ ] Create customer portal invoice view route (/invoices/:id)
- [ ] Implement read-only invoice display with itemized details
- [ ] Add Stripe test mode integration with payment intents
- [ ] Create Stripe webhook handler for payment events
- [ ] Build payment button and Stripe Elements integration
- [ ] Test end-to-end payment flow with status updates
- [ ] Ensure proper authorization and security

## Comprehensive Implementation Strategy

### 1. Stripe Setup
- Create Stripe account in test mode
- Add environment variables: `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_PUBLISHABLE_KEY`
- Install `stripe` npm package in backend
- Configure webhook endpoints for production

### 2. Payment Button in Customer Portal
- "Pay Invoice" button appears when `invoice.status = 'sent'`
- Clicking opens Stripe Checkout modal
- Supports credit/debit cards, Apple Pay, Google Pay
- Mobile-responsive payment interface

### 3. Backend: Create Payment Intent
- New Netlify Function: `/netlify/functions/create-payment-intent.mjs`
- Receives invoice ID from frontend
- Validates invoice ownership and status
- Calls Stripe API to create payment session
- Returns client secret to frontend
- Includes invoice details for Stripe metadata

### 4. Frontend: Stripe Checkout
- Uses `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Renders secure credit card input
- Handles 3D Secure authentication
- Shows loading states and error handling
- Redirects to success page on completion

### 5. Webhook: Payment Success
- New Netlify Function: `/netlify/functions/stripe-webhook.mjs`
- Listens for `payment_intent.succeeded` event
- Validates webhook signature for security
- Updates database:
  - `invoice.status` → `'paid'`
  - `invoice.paid_at` → timestamp
  - `request.status` → `'paid'` ✅ **Status sync**
- Sends receipt email via Resend
- Triggers SMS notification to business owner

### 6. Payment Tracking
- Admin dashboard shows payment status
- Overdue invoice alerts (due_date passed)
- Payment history log with Stripe transaction IDs
- Failed payment retry mechanisms

## Security Considerations
- Stripe webhook signature verification
- Never store credit card numbers (PCI compliance)
- All payments processed through Stripe's secure infrastructure
- Proper authorization checks for invoice access

## Cost Structure
- Stripe fee: 2.9% + $0.30 per transaction
- Example: $500 invoice = $14.80 fee
- Owner receives: $485.20
- Volume discounts available for high transaction volumes
