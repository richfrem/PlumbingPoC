# MASTER CLIENT DEPLOYMENT CHECKLIST

**Client:** [Client Business Name]
**Project Start Date:** YYYY-MM-DD
**Target Launch Date:** YYYY-MM-DD

---

## ⚡ QUICK SUMMARY

This checklist covers everything needed to deploy a fully customized AI-powered plumbing management platform for a real client. Total time investment: **12-16 hours** over **3-5 business days**.

**Required Accounts/Services:**
- Domain registrar (Namecheap/Netlify)
- Google Workspace/Microsoft 365 (email)
- Netlify Pro (~$25 CAD/month)
- Supabase Pro (~$35 CAD/month)  
- OpenAI API (~$10-30 CAD/month)
- Google Cloud/Maps (~$10-20 CAD/month)
- Resend Email (~$20 CAD/month)
- Twilio SMS (~$15-25 CAD/month)

**Total Monthly Cost: ~$115-155 CAD**

---

## 📋 PHASE 0: PRE-ONBOARDING PREPARATION

### Git & Development Setup
- [ ] **Create client branch:** `git checkout -b client/[client-name]`
- [ ] **Prepare schema.sql** with latest database structure
- [ ] **Duplicate this checklist** → `[ClientName]_Deployment_Checklist.md`
- [ ] **Schedule 1-hour Account Setup Call** with client
- [ ] **Prepare customization materials request** (logo, content, etc.)

### Client Information Gathering
- [ ] **Business name** and legal entity details
- [ ] **Service area** (cities, regions covered)
- [ ] **Specialties** (tankless water heaters, gas lines, emergency service, etc.)
- [ ] **Years in business** and company story
- [ ] **Certifications** and warranties offered
- [ ] **Current phone number** for admin SMS notifications
- [ ] **Preferred domain name** options
- [ ] **Existing Google Reviews** (for testimonials integration)

---

## 📞 PHASE 1: GUIDED ACCOUNT SETUP (2-3 hours)

### Domain & Email
- [ ] **Domain Purchase:** Guide client through domain registration
- [ ] **Professional Email:** Set up Google Workspace or Microsoft 365
- [ ] **Email Configuration:** Configure MX, SPF, DKIM records

### Core Platform Accounts
- [ ] **Netlify Account:**
  - [ ] Sign up for new account
  - [ ] Upgrade to Pro Plan (~$25 CAD/month)
  - [ ] Invite your email as Team Member
- [ ] **Supabase Account:**
  - [ ] Sign up for new account
  - [ ] Create Organization and Project
  - [ ] Upgrade to Pro Plan (~$35 CAD/month)
  - [ ] Invite your email as Administrator

### API Services
- [ ] **OpenAI Account:**
  - [ ] Sign up for OpenAI account
  - [ ] Generate API key
  - [ ] Secure key in client's password manager
- [ ] **Google Cloud Account:**
  - [ ] Sign up or use existing account
  - [ ] Create new project
  - [ ] Enable Maps JavaScript API
  - [ ] Enable Geocoding API
  - [ ] Create and restrict API key
- [ ] **Resend Account:**
  - [ ] Sign up for Resend account
  - [ ] Complete domain verification
  - [ ] Generate API key
- [ ] **Twilio Account:**
  - [ ] Sign up for Twilio account
  - [ ] Purchase phone number for SMS
  - [ ] Copy Account SID and Auth Token

---

## 🔧 PHASE 2: TECHNICAL CONFIGURATION (4-6 hours)

### Supabase Database Setup
- [ ] **Database Schema:**
  - [ ] Run `schema.sql` in SQL Editor
  - [ ] Create `PlumbingPoCBucket` storage bucket
  - [ ] Apply storage policies
- [ ] **Authentication Setup:**
  - [ ] Configure Google OAuth provider
  - [ ] Configure Microsoft/Azure OAuth provider
  - [ ] Update Site URL and Redirect URLs
  - [ ] Create initial admin user account
  - [ ] Set admin role in `user_profiles` table

### Netlify Deployment Configuration
- [ ] **Site Setup:**
  - [ ] Create new site from Git (client branch)
  - [ ] Configure build settings: `npm run build`, `packages/frontend/dist`
- [ ] **Environment Variables:**
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `VITE_GOOGLE_MAPS_API_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `RESEND_FROM_EMAIL`
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_PHONE_NUMBER`
  - [ ] `ADMIN_PHONE_NUMBER`
- [ ] **Domain Configuration:**
  - [ ] Add custom domain
  - [ ] Configure DNS settings
  - [ ] Verify SSL certificate

---

## 🎨 PHASE 3: CONTENT & BRANDING CUSTOMIZATION (4-6 hours)

### Visual Branding
- [ ] **Logo Integration:**
  - [ ] Replace logo files in `packages/frontend/public/`
  - [ ] Update favicon and app icons
- [ ] **Color Scheme:**
  - [ ] Update primary colors in Tailwind config
  - [ ] Adjust brand colors throughout components

### Business Identity Replacement
- [ ] **Main App File** (`packages/frontend/src/main.tsx`):
  - [ ] Replace "AquaFlow Plumbing" in header (line ~256)
  - [ ] Replace company name in footer (line ~368)
  - [ ] Update copyright notice (line ~371)

### Landing Page Content
- [ ] **About Section** (`AboutSection.tsx`):
  - [ ] Update company name (line ~56)
  - [ ] Replace experience years and company story (line ~57)
  - [ ] Customize value proposition and background
- [ ] **Contact Section** (`ContactSection.tsx`):
  - [ ] Replace email address (`info@aquaflowplumbing.com`)
  - [ ] Update phone number
  - [ ] Update business address
  - [ ] Update service area description
- [ ] **Services Section** (`ServicesSection.tsx`):
  - [ ] Update component documentation comments

### Services Configuration
- [ ] **Services Data** (`packages/frontend/src/lib/servicesData.ts`):
  - [ ] Replace with client's specific services
  - [ ] Update service descriptions and features
  - [ ] Customize icons to match services
  - [ ] Add client's specialties (e.g., tankless, gas lines)
- [ ] **Quote Questions** (`packages/frontend/src/lib/serviceQuoteQuestions.ts`):
  - [ ] Customize intake questions for client's services
  - [ ] Add service-specific qualification questions

### Reviews & Testimonials
- [ ] **Reviews Section** (`ReviewsSection.tsx`):
  - [ ] Replace placeholder testimonials
  - [ ] Add real Google Reviews (with permission)
  - [ ] Include customer names (first name + last initial)
  - [ ] Add link to Google Reviews if desired

### SEO & Metadata
- [ ] **Page Titles:** Update for local SEO
- [ ] **Meta Descriptions:** Customize for service area
- [ ] **Keywords:** Add local plumbing terms
- [ ] **Schema Markup:** Update business information

---

## 🧪 PHASE 4: TESTING & VALIDATION (2 hours)

### End-to-End Testing
- [ ] **Customer Journey Test:**
  - [ ] Register new test user
  - [ ] Request quote with real local address
  - [ ] Verify address geocoding works
  - [ ] Check photo upload functionality
  - [ ] Verify AI conversation flow
- [ ] **Admin Dashboard Test:**
  - [ ] Log in as admin
  - [ ] Verify quote appears in Command Center
  - [ ] Check Map View with correct pin location
  - [ ] Test quote creation and sending
  - [ ] Verify SMS notifications work
  - [ ] Check email delivery through Resend logs

### Final Deployment
- [ ] **Git Commit & Push:**
  - [ ] Commit all customization changes
  - [ ] Push to client branch
  - [ ] Verify Netlify build succeeds
- [ ] **Production Verification:**
  - [ ] Test on client's custom domain
  - [ ] Verify SSL certificate
  - [ ] Check all functionality on production

---

## 📚 PHASE 5: HANDOFF & TRAINING (1 hour)

### Training Call Preparation
- [ ] **Demo Account Setup:** Create sample data for demonstration
- [ ] **Training Materials:** Prepare user guide/walkthrough
- [ ] **Support Documentation:** Provide ongoing maintenance info

### Client Training Session
- [ ] **System Walkthrough:**
  - [ ] Customer quote request process
  - [ ] Admin Command Center tour
  - [ ] Map View and job management
  - [ ] Quote creation and communication
  - [ ] SMS and email notifications
- [ ] **Q&A Session:** Address client questions and concerns
- [ ] **Next Steps:** Discuss ongoing support options

### Project Completion
- [ ] **Handoff Documentation:**
  - [ ] Provide login credentials
  - [ ] Document monthly service costs
  - [ ] Outline support/maintenance plan
- [ ] **Follow-up Email:** Send summary with important links
- [ ] **Project Closure:** Mark project as complete

---

## 📊 SUCCESS METRICS

### Technical Validation
- [ ] Site loads properly on custom domain
- [ ] All forms submit without errors
- [ ] SMS notifications deliver within 30 seconds
- [ ] Email notifications deliver successfully
- [ ] Map view shows correct job locations
- [ ] File uploads work (images, documents)

### Business Validation  
- [ ] Client can navigate admin dashboard independently
- [ ] Quote creation process is understood
- [ ] Customer journey feels professional
- [ ] Branding accurately represents client business
- [ ] All contact information is correct

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Account Setup Issues
- **OAuth Setup:** Ensure callback URLs match Supabase project
- **Email Delivery:** Verify domain verification in Resend
- **SMS Delivery:** Check Twilio phone number region settings

### Content Issues
- **Logo Quality:** Ensure SVG or high-res PNG for crisp display
- **Service Descriptions:** Keep concise but informative
- **Local SEO:** Include city/region names in content

### Technical Issues
- **Environment Variables:** Double-check all keys are correct
- **Build Failures:** Verify all dependencies are in package.json
- **Map Functionality:** Ensure Google Maps API has correct restrictions

---

## 💰 FINAL COST SUMMARY

| Service | Monthly Cost (CAD) | Annual Cost (CAD) |
|---------|-------------------|-------------------|
| Netlify Pro | $25 | $300 |
| Supabase Pro | $35 | $420 |
| OpenAI API | $10-30 | $120-360 |
| Google Maps | $10-20 | $120-240 |
| Resend Email | $20 | $240 |
| Twilio SMS | $15-25 | $180-300 |
| Domain | $2 | $20 |
| Professional Email | $8 | $96 |
| **TOTAL** | **$115-155** | **$1,380-1,860** |

**🎯 Client Value Proposition:** 
Complete AI-powered business management platform for the cost of 1-2 service calls per month.