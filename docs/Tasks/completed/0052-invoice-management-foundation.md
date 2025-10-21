---
id: 0052
status: completed
priority: high
owner: richfrem
estimate: 3 weeks
created: 2024-10-01
links:
  - docs/ROADMAP_AND_TASKS.md#phase-1
acceptance_criteria:
  - Create Invoice/Edit/View buttons in Request Detail Modal
  - Implement InvoiceFormModal.tsx with itemized line items
  - Add BC tax calculation (GST 5% all, PST 7% materials)
  - Create database schema with request_id FK relationship
  - Implement backend API endpoints for invoice CRUD operations
  - Add useInvoiceById hook following request pattern
  - Create Unified CustomerInfoSection component
  - Implement status synchronization (request.status → 'invoiced')
  - Fix Supabase FK join issues
notes: |
  Completed foundation for invoice management system including UI, backend API, database schema, and status synchronization. Provides complete invoice creation, editing, and viewing capabilities for administrators.

  ## Business Context: Quotes vs Invoices

  The platform distinguishes between two critical financial documents that serve different purposes in the customer journey:

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
  - 💼 **Professionalism:** Industry-standard practice for trades
  - 🔍 **Accountability:** Documents scope changes and upsells
  - 📈 **Analytics:** Track quote accuracy and margin per job
---

# Invoice Management: Phase 1 Foundation (COMPLETED)

## Key Tasks

- [x] Design Invoice Builder UI (InvoiceFormModal.tsx)
- [x] Implement itemized line item entry (labor + materials)
- [x] Basic status sync (invoiced)
- [x] Admin can create/edit/view invoices
- [x] Database schema with request_id FK
- [x] Backend API with proper authentication
- [x] useInvoiceById hook following request pattern
- [x] Unified CustomerInfoSection component
- [x] Fixed Supabase FK join issues

## Implemented Features

### 1. ✅ Invoice Builder UI (InvoiceFormModal.tsx)
- Itemized line items for labor and materials
- Dynamic add/remove line items
- Real-time BC tax calculation (GST 5% on all, PST 7% on materials only)
- Subtotal + Tax = Total Due with auto-calculation
- Due date picker and payment method selector
- Notes field for additional context

### 2. ✅ Database Schema
```sql
invoices table (Enhanced):
- id (UUID), request_id (FK to requests)
- line_items (JSONB array with type, description, quantity, unit_price)
- subtotal, gst_amount, pst_amount, total_amount
- due_date, payment_method, notes
- status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
- paid_at, created_at, updated_at
```

### 3. ✅ Backend API (invoiceController.js)
- POST `/api/requests/:requestId/invoices` - Create invoice
- GET `/api/invoices/:id` - Get invoice with request data (FK join fixed)
- PATCH `/api/invoices/:id` - Update invoice (blocks if paid)
- POST `/api/invoices/:id/mark-paid` - Mark as paid
- GET `/api/invoices` - List invoices (admin sees all, users see own)
- Authentication & authorization (admin or request owner)

### 4. ✅ Frontend Integration
- "Create Invoice" / "Edit Invoice" / "View Invoice" buttons in Request Detail Modal
- Modes: create, edit, view with proper access control
- useInvoiceById hook following same pattern as useRequestById
- Unified CustomerInfoSection component for consistent display

### 5. ✅ Status Synchronization
- When invoice created: `request.status` → `'invoiced'`
- Proper status workflow integration

## Technical Achievements
- ✅ Fixed Supabase FK join issues (documented in DEVELOPMENT_ENVIRONMENT_SETUP.md)
- ✅ Proper separation of chip color vs header background color
- ✅ Removed redundant customer name from modal header
- ✅ Invoice data pre-population for edit mode
