---
id: 0003
status: completed
priority: high
owner: richfrem
estimate: 1 week
created: 2024-10-01
links:
  - docs/TASKS.md#privacy--gpt-interaction
acceptance_criteria:
  - Do not share personal info (name, phone, email, address) with GPT
  - Only send context-specific info for follow-up questions
  - Efficiently package quote info for GPT
  - Ask GPT if additional questions are needed
  - Repeat until GPT confirms all key questions are answered
  - Add backend comment/validation to enforce privacy in GPT prompt (optional)
notes: |
  Implemented privacy controls to prevent sharing personal information with GPT, ensuring only context-specific data is sent for quote processing.
---

# Privacy & GPT Interaction

## Details
- [x] Do not share personal info (name, phone, email, address) with GPT
- [x] Only send context-specific info for follow-up questions
- [x] Efficiently package quote info for GPT
- [x] Ask GPT if additional questions are needed
- [x] Repeat until GPT confirms all key questions are answered
- [ ] Add backend comment/validation to enforce privacy in GPT prompt (optional)
