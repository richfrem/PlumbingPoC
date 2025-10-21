---
id: 0051
status: planned
priority: low
owner: richfrem
estimate: 2 weeks
created: 2024-10-01
links:
  - docs/TASKS.md#new-feature-ideas
acceptance_criteria:
  - Prompt appears on successful invoice payment completion
  - One-click 'Leave a review' button opens correct Google review URL
  - Optional SMS/email follow-up with review link
  - Admin dashboard shows review request metrics and click tracking
  - No PII leaked to third-party APIs
  - Handle duplicate prompts and rate limiting
notes: |
  Nice.job-style Google review prompt system. When customers complete invoice payments, present an in-app prompt inviting them to leave Google reviews. Includes optional SMS/email follow-up and comprehensive metrics tracking.
---

# Invoice Payment → Google Review Prompt (nice.job-style)

## Details
- [ ] Add payment confirmation modal with review prompt
- [ ] Implement one-click Google review URL generation
- [ ] Create optional SMS/email follow-up system
- [ ] Build admin dashboard metrics for review requests
- [ ] Add duplicate prevention and rate limiting
- [ ] Ensure PII protection and privacy compliance

## Implementation Notes
- **Frontend:** Add prompt to payment confirmation modal
- **Backend:** Store opt-in preferences and delivery tracking
- **Admin:** Surface metrics on review requests sent and clicks
- **Edge Cases:** Handle multiple payments, cancelled flows, rate limits, Google link failures
