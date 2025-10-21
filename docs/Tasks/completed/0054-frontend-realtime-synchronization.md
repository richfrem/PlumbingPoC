---
id: 0054
status: planned
priority: high
owner: richfrem
estimate: 1 week
created: 2025-10-18
links:
  - docs/TASKS.md#frontend--realtime
acceptance_criteria:
  - Real-time status updates for all request states (new → quoted → accepted → scheduled → in_progress → completed → invoiced → paid)
  - Invoice status synchronization (draft → sent → paid/overdue)
  - Cross-user real-time updates (admin changes visible to customers instantly)
  - Real-time notifications for status changes
  - Performance testing for real-time subscriptions
  - Error handling for connection drops
  - Mobile app real-time sync (if applicable)
notes: |
  Comprehensive real-time synchronization implementation for frontend, building on the basic Supabase integration in task 0010. This task focuses on ensuring all status changes and data updates are synchronized in real-time across all users.
---

# Frontend: Real-Time Synchronization

## Details

Implement comprehensive real-time synchronization for all data changes in the PlumbingPOC application, ensuring instant updates across all users and devices.

### Current State
- Basic Supabase real-time subscriptions are implemented via `useSupabaseRealtimeV3` hook
- TanStack Query cache invalidation works for basic CRUD operations
- Real-time updates work for requests, quotes, notes, and attachments

### Required Enhancements

#### 1. Complete Status Lifecycle Real-Time Updates
- [ ] Request status changes (all states: new, viewed, quoted, accepted, scheduled, in_progress, completed, invoiced, paid, overdue, disputed, cancelled)
- [ ] Invoice status changes (draft, sent, paid, overdue, disputed, partially_paid, cancelled)
- [ ] Quote status changes (draft, sent, accepted, rejected, expired)
- [ ] User profile updates (name, email, phone changes)

#### 2. Cross-User Synchronization
- [ ] Admin updates instantly visible to customers
- [ ] Customer actions instantly visible to admin
- [ ] Multiple admin users see each other's changes
- [ ] Real-time collaboration features

#### 3. Real-Time Notifications
- [ ] Browser notifications for status changes
- [ ] In-app notification badges
- [ ] Email/SMS notifications for critical status changes
- [ ] Notification preferences per user

#### 4. Performance & Reliability
- [ ] Connection drop recovery
- [ ] Subscription cleanup on component unmount
- [ ] Memory leak prevention
- [ ] Performance monitoring for subscription overhead
- [ ] Graceful degradation when real-time fails

#### 5. Mobile & Offline Support
- [ ] Real-time sync works on mobile devices
- [ ] Offline change queuing and sync on reconnection
- [ ] Background sync for mobile apps

### Technical Implementation

#### Enhanced useSupabaseRealtimeV3 Hook
- Add invoice table subscriptions
- Implement status-specific event filtering
- Add connection health monitoring
- Implement retry logic for failed connections

#### Status Synchronization Logic
- Automatic request.status updates based on invoice.status changes
- Bidirectional sync between related entities
- Conflict resolution for concurrent updates

#### Notification System
- Real-time notification service
- User preference management
- Notification history and archiving

### Testing Requirements
- [ ] Unit tests for real-time hooks
- [ ] Integration tests for cross-user sync
- [ ] Performance tests for multiple concurrent users
- [ ] Mobile device testing
- [ ] Offline/online transition testing

### Dependencies
- Task 0010 (Supabase integration) - completed
- Task 0047 (Stripe payments) - for payment status sync
- Task 0053 (Enhanced status workflow) - for complete status lifecycle
