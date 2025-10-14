# PlumbingPOC Manual Test Scenarios

## Overview
This document outlines comprehensive manual test scenarios to validate PlumbingPOC functionality before deployment. Tests are organized by user roles and workflows.

## Test Environment Setup
- **Frontend**: http://localhost:i5173
- **Backend**: http://localhost:3000
- **Test Users**:
  - Admin: see .env
  - User: see .env`

## 1. User Registration & Authentication

### 1.1 Landing Page Access
- [ ] Visit landing page without authentication
- [ ] No 401 errors in console
- [ ] All navigation links work
- [ ] "Request a Quote" button prompts login

### 1.2 User Registration
- [ ] Click "Sign In" → "Sign Up"
- [ ] Complete profile form
- [ ] Verify email confirmation (if implemented)
- [ ] Login with new credentials

### 1.3 Admin Login
- [ ] Login as admin user
- [ ] Verify admin dashboard access
- [ ] Check admin-specific UI elements

## 2. Quote Request Creation (User Flow)

### 2.1 Create Quote Request with Attachment
- [ ] Login as regular user
- [ ] Click "Request a Quote"
- [ ] Complete quote request form with all fields
- [ ] Upload attachment via drag-and-drop
- [ ] Verify attachment preview
- [ ] Submit request
- [ ] Verify success message
- [ ] Check request appears in "My Requests"

### 2.2 Quote Request Without Attachment
- [ ] Create request without attachment
- [ ] Verify submission works
- [ ] Check request status is "new"

## 3. Admin Dashboard & Management

### 3.1 Command Center Dashboard
- [ ] Login as admin
- [ ] Navigate to dashboard
- [ ] Verify requests table displays
- [ ] Check map view shows request locations
- [ ] Test table sorting and filtering
- [ ] Verify request status indicators

### 3.2 Request Details View
- [ ] Click on request in table
- [ ] Verify modal opens with full details
- [ ] Check customer information
- [ ] Verify attachment display
- [ ] Test address/location display

### 3.3 Admin Attachment Upload
- [ ] Open request details modal
- [ ] Drag and drop files into attachment section
- [ ] Verify files upload successfully
- [ ] Check file previews work
- [ ] Verify attachments appear for user

## 4. Quote Management

### 4.1 Create Quote
- [ ] Open request details as admin
- [ ] Click "Add New Quote"
- [ ] Fill quote form with labor/material items
- [ ] Add pricing and notes
- [ ] Save quote
- [ ] Verify quote appears in request
- [ ] Check request status changes to "quoted"

### 4.2 Update Existing Quote
- [ ] Click "Update" on existing quote
- [ ] Modify pricing or details
- [ ] Save changes
- [ ] Verify quote updates
- [ ] Check request status remains "quoted"

### 4.3 Create Change Order
- [ ] Accept a quote first (see section 5)
- [ ] Click "Change Order" button on accepted quote
- [ ] Create new quote for additional work
- [ ] Verify change order appears as separate quote
- [ ] Check change order has "Change Order" status

## 5. Communication & Notes

### 5.1 User Adds Notes
- [ ] Login as user
- [ ] Open request details
- [ ] Add note in communication log
- [ ] Verify note appears with "customer" author
- [ ] Check timestamp

### 5.2 Admin Adds Notes
- [ ] Login as admin
- [ ] Open request details
- [ ] Add note in communication log
- [ ] Verify note appears with "admin" author
- [ ] Check user can see admin notes

## 6. Quote Acceptance Flow

### 6.1 User Accepts Quote
- [ ] Login as user
- [ ] Open quoted request
- [ ] Click "Accept" on quote
- [ ] Verify success message appears
- [ ] Refresh page and check quote status is "accepted"
- [ ] Check request status is "accepted"

### 6.2 User Accepts Change Order
- [ ] With accepted original quote
- [ ] Accept change order quote
- [ ] Verify change order becomes "accepted"
- [ ] Check original quote becomes "rejected"
- [ ] Verify request status remains "accepted"

## 7. Job Scheduling & Completion

### 7.1 Admin Schedules Job
- [ ] Login as admin
- [ ] Open accepted request
- [ ] Click "Schedule Job" or similar
- [ ] Set date/time
- [ ] Verify request status changes to "scheduled"
- [ ] Check scheduled date displays

### 7.2 Admin Completes Job
- [ ] Open scheduled request
- [ ] Click "Mark as Completed"
- [ ] Fill completion details
- [ ] Submit completion
- [ ] Verify request status changes to "completed"
- [ ] Check completion notes saved

## 8. Status Transitions & Edge Cases

### 8.1 Status Flow Validation
- [ ] new → quoted → accepted → scheduled → completed
- [ ] Verify each status transition works
- [ ] Check status colors and indicators

### 8.2 Multiple Quotes
- [ ] Create multiple quotes for one request
- [ ] Accept one quote
- [ ] Verify other quotes become "rejected"
- [ ] Check only accepted quote remains active

### 8.3 Permission Checks
- [ ] User cannot access admin dashboard
- [ ] User cannot modify other users' requests
- [ ] Admin can access all requests
- [ ] Admin can modify any request

## 9. Mobile Responsiveness

### 9.1 Mobile Navigation
- [ ] Test hamburger menu
- [ ] Verify mobile dashboard
- [ ] Check modal responsiveness

### 9.2 Touch Interactions
- [ ] Test drag-and-drop on mobile
- [ ] Verify button sizes and spacing
- [ ] Check form inputs on mobile

## 10. Error Handling

### 10.1 Network Errors
- [ ] Test with slow/poor connection
- [ ] Verify error messages display
- [ ] Check retry functionality

### 10.2 Validation Errors
- [ ] Submit forms with missing required fields
- [ ] Upload invalid file types
- [ ] Test quote calculation errors

### 10.3 Authentication Errors
- [ ] Test expired sessions
- [ ] Verify re-login prompts
- [ ] Check protected route access

## 11. Performance & Usability

### 11.1 Load Times
- [ ] Dashboard loads within 3 seconds
- [ ] Modals open quickly
- [ ] File uploads complete promptly

### 11.2 UI/UX
- [ ] Intuitive navigation
- [ ] Clear status indicators
- [ ] Helpful error messages
- [ ] Consistent styling

## Test Completion Checklist

- [ ] All scenarios pass without errors
- [ ] No console errors or warnings
- [ ] UI updates correctly (may require refresh for quote acceptance)
- [ ] Mobile experience works
- [ ] Performance acceptable
- [ ] Ready for deployment

## Known Issues (Document for Reference)
- UI may not update immediately after quote acceptance (requires manual refresh)
- Query invalidation disabled to prevent infinite API loops

## Pre-Deployment Configuration

### Supabase Production Setup
**IMPORTANT**: Before deploying to production, update Supabase configuration:

1. **Site URL**: Change from `localhost:5173` to `https://plumbingpoc.netlify.app`
2. **Redirect URLs**: Update authentication redirect URLs in Supabase dashboard
3. **CORS Settings**: Ensure production domain is whitelisted

### Environment Variables
Verify production environment has correct values:
- `VITE_SUPABASE_URL=https://oxoiwzijacglgueemlva.supabase.co`
- `VITE_FRONTEND_BASE_URL=https://plumbingpoc.netlify.app`
- `VITE_BACKEND_BASE_URL=https://plumbingpoc.netlify.app`

## Post-Deployment Monitoring
- Monitor error logs
- Check user feedback
- Verify attachment uploads work in production
- Monitor API performance
- Test authentication flows in production
- Verify Supabase redirects work correctly
