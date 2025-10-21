---
id: 0014
status: completed
priority: medium
owner: richfrem
estimate: 1 day
created: 2024-10-01
links:
  - docs/TASKS.md#backend--api
acceptance_criteria:
  - Make quotes read-only after request status is 'Accepted', 'Scheduled', or 'Completed'
notes: |
  Implemented business rules to lock quotes after final status changes.
---

# Backend: Quote Read-Only Rules

## Details
- [x] Make quotes read-only after request status is 'Accepted', 'Scheduled', or 'Completed'
