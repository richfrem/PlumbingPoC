---
id: 0053
status: planned
priority: medium
owner: richfrem
estimate: 3 weeks
created: 2024-10-18
links:
  - docs/ROADMAP_AND_TASKS.md#phase-4-request-status-lifecycle--synchronization
acceptance_criteria:
  - Enhanced request status workflow supports invoicing/payment states
  - Status synchronization between invoice and request tables
  - Dashboard filtering and visual indicators for new statuses
  - Automated status updates and business rule enforcement
  - Backward compatibility with existing status values
notes: |
  Major architectural enhancement to support full invoicing/payment lifecycle. Adds new statuses (invoiced, paid, overdue, disputed) and automated synchronization rules between invoice and request entities.
---

# Enhanced Request Status Lifecycle & Synchronization

## Overview
Implement comprehensive status workflow that reflects the complete job lifecycle from quote to payment, including invoicing and payment states that are currently missing from the request.status field.

## Current Problem
The `request.status` field only tracks up to 'completed' but doesn't reflect invoicing/payment states, creating a disconnect between the job completion and financial closure.

## Proposed Solution

### New Status Workflow
```
new → quoted → accepted → scheduled → in_progress →
completed → invoiced → paid (OR overdue OR disputed)
```

### New Statuses to Add
1. **`invoiced`** - Invoice created and sent to customer
2. **`paid`** - Customer paid invoice (job fully closed)
3. **`overdue`** - Invoice past due date without payment
4. **`disputed`** - Customer contested charges (needs resolution)
5. **`partially_paid`** - Partial payment received (optional)

### Status Synchronization Rules

| Invoice Status | Request Status | Action Triggered |
|---------------|---------------|------------------|
| `draft` | `completed` | Invoice being prepared |
| `sent` | `invoiced` | Email sent to customer |
| `paid` | `paid` | ✅ Job complete, send receipt, SMS owner |
| `overdue` | `overdue` | 🔔 Send payment reminder, alert owner |
| `disputed` | `disputed` | 🚨 Flag for owner review, pause collections |
| `cancelled` | `completed` | Return to completed state |

## Implementation Details

### Database Changes
- Update `requests` table constraint to include new statuses
- Add database triggers or application logic for status sync
- Ensure backward compatibility with existing data

**Required Database Schema Changes:**
```sql
-- Add new request statuses
ALTER TABLE requests
  ADD CONSTRAINT valid_status
  CHECK (status IN ('new', 'quoted', 'accepted', 'scheduled',
                    'in_progress', 'completed', 'invoiced',
                    'paid', 'overdue', 'disputed', 'cancelled'));

-- Add invoice_id to requests table for easy lookup
ALTER TABLE requests
  ADD COLUMN invoice_id UUID REFERENCES invoices(id);

-- Indexes for performance
CREATE INDEX idx_requests_invoice_id ON requests(invoice_id);
```

### Backend Logic
- Implement status synchronization in invoice controller
- Add business rules for automatic status transitions
- Create API endpoints for manual status overrides

### Frontend Updates
- Update dashboard filters to include new statuses
- Add visual indicators (colors, icons) for status types
- Implement Kanban board drag-and-drop for status changes

### Business Rules
- Prevent certain status transitions (e.g., can't go from 'paid' back to 'invoiced')
- Automated reminders for overdue invoices
- Status-based permissions and UI restrictions

## Success Criteria
- [ ] All new statuses properly integrated into workflow
- [ ] Status synchronization works bidirectionally
- [ ] Dashboard provides clear visibility into payment states
- [ ] No breaking changes to existing functionality
- [ ] Automated business rules reduce manual status management
- [ ] Enhanced status workflow implementation - See task 0053
