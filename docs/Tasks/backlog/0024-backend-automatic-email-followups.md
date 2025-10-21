---
id: 0024
status: planned
priority: medium
owner: richfrem
estimate: 1 week
created: 2024-10-01
links:
  - docs/TASKS.md#backend--api
acceptance_criteria:
  - Create a Netlify Scheduled Function for automated follow-ups
  - Move the follow-up email logic from the Express controller to the new Netlify function
  - Remove the old /api/follow-up route and controller
  - Implement email audit record insertion for tracking sent messages
  - Query database for requests with 'quoted' status older than 3 days
  - Send templated follow-up emails via Resend API
notes: |
  Implement automated email follow-ups using Netlify Scheduled Functions to replace the current Express controller logic. Uses Resend API for email delivery with comprehensive audit logging.
---

# Backend: Automatic Email Follow-ups

## Implementation Strategy
**Technology:** Resend API (already integrated in `packages/backend/api/services/email/resend/client.js`).

**Trigger:** A **Netlify Scheduled Function**. This is a special type of function that Netlify can run automatically on a cron schedule (e.g., "every morning at 9 AM").

**Logic:** The scheduled function will query the Supabase database for all requests with a `status` of 'quoted' where the quote was sent more than [e.g., 3 days] ago and no follow-up has been sent. It will then loop through the results and send a templated follow-up email.

## Operational Notes
The `email_audit` table and Supabase migration were added during the recent email work, and transactional emails are successfully sending via Resend from Netlify. However, the current send path is not inserting audit rows into `email_audit` — the table exists but contains no records.

## Next Steps (High Priority)
- Implement insertion of audit records in `packages/backend/api/services/email/resend/client.js` immediately after a successful Resend send call. Persist fields: `request_id`, `recipient`, `resend_message_id` (provider id), `provider_response` (jsonb), `status`, `sent_at`.
- Add unit tests and an integration test for audit insertion (run against local Supabase dev or test DB).
- After audit persistence is confirmed, implement PDF invoice generation and attach/send invoice PDF via Resend.

## Details
- [ ] Create a Netlify Scheduled Function for automated follow-ups
- [ ] Move the follow-up email logic from the Express controller to the new Netlify function
- [ ] Remove the old /api/follow-up route and controller
- [ ] Implement email audit record insertion for tracking sent messages
- [ ] Query database for requests with 'quoted' status older than 3 days
- [ ] Send templated follow-up emails via Resend API
