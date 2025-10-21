# Task Schema

This document defines the schema for task files in the `docs/Tasks/` folder structure. Each task is stored as a separate Markdown file with YAML frontmatter metadata.

## File Naming Convention
- Files are named with a zero-padded number (e.g., `0001-task-title.md`)
- Located in status subfolders: `planned/`, `in-progress/`, `blocked/`, `review/`, `completed/`, `cancelled/`

## YAML Frontmatter Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | Yes | Unique task identifier (matches filename number) | `0001` |
| `status` | string | Yes | Current task status | `completed`, `in-progress`, `planned`, `blocked`, `review`, `cancelled` |
| `priority` | string | No | Task priority level | `high`, `medium`, `low` |
| `owner` | string | No | Person responsible for the task | `richfrem` |
| `estimate` | string | No | Time estimate for completion | `2 weeks`, `3 days` |
| `created` | date | No | Date task was created (YYYY-MM-DD) | `2024-10-01` |
| `links` | array | No | Related documentation links | `- docs/TASKS.md#section` |
| `acceptance_criteria` | array | No | List of completion criteria | `- Feature works as expected` |
| `notes` | string | No | Additional notes or context | Multi-line text |

## Markdown Content Structure

### Title
- H1 heading with the task title
- Should be concise and descriptive

### Details
- Detailed description of the task
- Can include checklists, bullet points, code examples
- Use standard Markdown formatting

### Work Log (Optional)
- Chronological log of work done on the task
- Format: `YYYY-MM-DD: Description of work completed`
- Useful for tracking progress and time spent

## Example Task File

```yaml
---
id: 0001
status: completed
priority: high
owner: richfrem
estimate: 2 weeks
created: 2024-10-01
links:
  - docs/TASKS.md#user-registration--profile
  - docs/ROADMAP_AND_TASKS.md#user-registration--profile
acceptance_criteria:
  - User can register with email/password
  - Profile page displays user info
  - Sign-in working
notes: |
  Completed basic user registration and profile functionality.
---

# User Registration & Profile

## Details
- [x] Implement user registration form
- [x] Add email/password authentication
- [x] Create profile page
- [x] Test sign-in functionality

## Work Log
- 2024-10-01: Started user registration implementation
- 2024-10-05: Completed authentication flow
- 2024-10-10: Added profile page and testing
```
