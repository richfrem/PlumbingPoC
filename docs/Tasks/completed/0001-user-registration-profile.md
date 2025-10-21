---
id: 0001
title: "User Registration & Profile"
status: completed
priority: high
owner: team
estimate: completed
created: 2025-10-18
links:
  - docs/TASKS.md
  - docs/ROADMAP_AND_TASKS.md
acceptance_criteria:
  - Sign-in working
  - Sign-out working
  - Register new user with Google working
  - Register new user with Microsoft working
  - Create new profile with email/password working
  - Create new profile working
  - Update existing profile working
  - Ensure user profile includes contact info
  - Pull profile info into quote requests (Admins can now see all user profiles)
notes: >
  Core user management flows implemented and tested. All authentication methods working via Supabase Auth.
---
## Summary
Implement comprehensive user registration, authentication, and profile management for the PlumbingPOC platform, supporting multiple auth providers and profile updates.

## Implementation notes
- Supabase Auth for authentication (Google, Microsoft, email/password)
- User profiles stored in `user_profiles` table
- RLS policies ensure admin access to all profiles
- Frontend: Auth context and profile forms
- Backend: Auth middleware and profile controllers

## Tasks
- [x] Sign-in working
- [x] Sign-out working
- [x] Register new user with Google working
- [x] Register new user with Microsoft working
- [x] Create new profile with email/password working
- [x] Create new profile working
- [x] Update existing profile working
- [x] Ensure user profile includes contact info
- [x] Pull profile info into quote requests (Admins can now see all user profiles)
