# Consultant's Onboarding Checklist

**Client:** [Client Business Name]
**Project Start Date:** YYYY-MM-DD

---

## Phase 0: Pre-Onboarding Preparation

*   [ ] **Duplicate this checklist** and rename it for the new client (e.g., `ClientName_Onboarding.md`).
*   [ ] **Create a new, clean branch** in the Git repository for the client's version of the code (`git checkout -b client/[client-name]`).
*   [ ] **Prepare the `schema.sql` file.** Ensure it's the latest version from your main project.
*   [ ] **Schedule the 1-hour "Account Setup & Onboarding Call"** with the client.

---

## Phase 1: Guided Account Setup (Live on call with client)

The client should be sharing their screen for this entire phase. Your job is to guide them.

*   **Domain Name:**
    *   [ ] Guide client to purchase their domain name (e.g., from Namecheap or directly via Netlify).
*   **Professional Email Hosting:**
    *   [ ] Discuss the importance of a branded email (`info@clientdomain.com`).
    *   [ ] Recommend Google Workspace or Microsoft 365.
    *   [ ] Guide client through the signup process for their chosen provider.
*   **Netlify Account:**
    *   [ ] Guide client to sign up for a new Netlify account.
    *   [ ] Guide client to upgrade to the **Pro Plan**.
    *   [ ] Have client invite your email address (`your-consulting-email@gmail.com`) as a **Team Member**.
*   **Supabase Account:**
    *   [ ] Guide client to sign up for a new Supabase account.
    *   [ ] Guide client to create a new **Organization** and **Project**.
    *   [ ] Guide client to upgrade the project to the **Pro Plan**.
    *   [ ] Have client invite your email address as an **Administrator** to the Organization.
*   **OpenAI Account:**
    *   [ ] Guide client to sign up for an OpenAI account.
    *   [ ] Guide client to the API Keys section.
    *   [ ] Have client generate a new API key.
    *   [ ] **Crucially:** Instruct client to **immediately copy this key** and keep it safe (e.g., in their password manager).
*   **Resend Account:**
    *   [ ] Guide client to sign up for a Resend account.
    *   [ ] **Crucially:** Guide them through the **domain verification process** within Resend.
    *   [ ] Have client generate a new API key.
    *   [ ] **Crucially:** Instruct client to **immediately copy this key**.
*   **Google Cloud Account (for Maps):**
    *   [ ] Guide client to sign up for a Google Cloud account (if they don't have one).
    *   [ ] Guide client to create a new project or use an existing one.
    *   [ ] Navigate to **APIs & Services** → **Library**.
    *   [ ] Enable the **Maps JavaScript API** and **Geocoding API**.
    *   [ ] Navigate to **APIs & Services** → **Credentials**.
    *   [ ] Create a new **API Key**.
    *   [ ] **Crucially:** Instruct client to **immediately copy this API key**.
    *   [ ] Guide client to restrict the API key (Application restrictions: HTTP referrers, API restrictions: Maps JavaScript API + Geocoding API).
*   **Twilio Account (for SMS):**
    *   [ ] Guide client to sign up for a Twilio account.
    *   [ ] Guide client to purchase a phone number for SMS sending.
    *   [ ] Navigate to Account → API Keys & Tokens.
    *   [ ] Copy the Account SID and Auth Token.
    *   [ ] **Crucially:** Instruct client to **immediately copy these credentials**.

---

## Phase 2: Technical Configuration (Your independent work)

*   **Supabase Configuration:**
    *   [ ] Log in to the client's Supabase project (via your delegated access).
    *   [ ] Go to the SQL Editor.
    *   [ ] **Run the `schema.sql` script** to create all tables and RLS policies.
    *   [ ] Create the `PlumbingPoCBucket` in Supabase Storage and apply the required storage policies (from `SUPABASE_DATABASE_AND_AUTH_SETUP.md`).
    *   [ ] Navigate to Authentication -> Providers.
    *   [ ] **Configure Google OAuth Provider:** Guide the client (on a call or via instructions) to create a Google Cloud OAuth client ID and provide you with the credentials to enter here. Add the new Supabase project's callback URL to their Google Cloud settings.
    *   [ ] **Configure Azure OAuth Provider:** Repeat the process for Microsoft/Azure.
    *   [ ] Navigate to Authentication -> URL Configuration and update the Site URL and Redirect URLs.
    *   [ ] **Create the initial admin user account** for the client within the Supabase Auth dashboard. Manually update their role to `admin` in the `user_profiles` table.

*   **Netlify Configuration:**
    *   [ ] Log in to the client's Netlify account.
    *   [ ] Create a "New site from Git" and connect it to your client-specific branch.
    *   [ ] Configure the build settings (e.g., `npm run build`, `packages/frontend/dist`).
    *   [ ] Go to Site Settings -> Build & Deploy -> Environment -> Environment variables.
    *   [ ] **Add all necessary environment variables:**
        *   `VITE_SUPABASE_URL` (from the new Supabase project)
        *   `VITE_SUPABASE_ANON_KEY` (from the new Supabase project)
        *   `SUPABASE_SERVICE_ROLE_KEY` (from the new Supabase project)
        *   `OPENAI_API_KEY` (the key the client generated)
        *   `VITE_GOOGLE_MAPS_API_KEY` (the Google Maps API key the client generated)
        *   `RESEND_API_KEY` (the key the client generated)
        *   `RESEND_FROM_EMAIL` (e.g., `contact@clientdomain.com`)
        *   `TWILIO_ACCOUNT_SID` (from the client's Twilio account)
        *   `TWILIO_AUTH_TOKEN` (from the client's Twilio account)
        *   `TWILIO_PHONE_NUMBER` (the phone number purchased from Twilio)
        *   `ADMIN_PHONE_NUMBER` (client's phone number for SMS notifications)
    *   [ ] Go to Domain management and add the client's custom domain.
    *   [ ] Follow the steps to configure DNS (usually by pointing the domain's nameservers to Netlify).
    *   [ ] **Add DNS records for Email Hosting:** Log in to the domain registrar/Netlify DNS panel and add the **MX, SPF, and DKIM records** provided by Google/Microsoft to direct email traffic correctly.

---

## Phase 3: Application Customization (Your code work)

*   **Branding:**
    *   [ ] Replace logo files in `packages/frontend/public/`.
    *   [ ] Update the primary color theme in the Tailwind/MUI config.
*   **Content Customization:**
    *   [ ] **Services Configuration:** Update `packages/frontend/src/lib/servicesData.ts` with client's specific services, descriptions, and features.
    *   [ ] **Service Questions:** Update `packages/frontend/src/lib/serviceQuoteQuestions.ts` with client-specific intake questions.
    *   [ ] **Business Identity:** Replace "AquaFlow Plumbing" with client's business name in:
        *   [ ] `packages/frontend/src/main.tsx` (3 locations)
        *   [ ] `packages/frontend/src/features/landing/components/AboutSection.tsx` (2 locations)
        *   [ ] `packages/frontend/src/features/landing/components/ServicesSection.tsx` (comment)
        *   [ ] `packages/frontend/src/features/landing/components/ContactSection.tsx` (comment)
        *   [ ] `packages/frontend/src/features/landing/components/ReviewsSection.tsx` (comment)
    *   [ ] **Contact Information:** Update throughout app:
        *   [ ] Email: Replace `info@aquaflowplumbing.com` in `ContactSection.tsx`
        *   [ ] Phone number in contact sections
        *   [ ] Business address and service area
        *   [ ] Update footer copyright information
    *   [ ] **About Section:** Update `AboutSection.tsx` with:
        *   [ ] Client's years of experience
        *   [ ] Client's unique value proposition
        *   [ ] Service area description
        *   [ ] Company history/background
    *   [ ] **Reviews/Testimonials:** Update `ReviewsSection.tsx` with:
        *   [ ] Real Google Reviews (with permission)
        *   [ ] Client testimonials
        *   [ ] Add Google Reviews link if available
    *   [ ] **Services Content:** Customize service descriptions to match:
        *   [ ] Client's specialties (e.g., tankless water heaters, gas lines)
        *   [ ] Certifications and warranties offered
        *   [ ] Emergency service availability
        *   [ ] Service area coverage
    *   [ ] **Meta Data:** Update:
        *   [ ] Page titles and descriptions
        *   [ ] SEO keywords for local area
        *   [ ] Business schema markup
*   **Commit and Push:**
    *   [ ] Commit all customization changes to the client's Git branch.
    *   [ ] Pushing the changes will trigger the first build on their Netlify account.

---

## Phase 4: Final Handoff

*   **End-to-End Test:** Perform a full test on the live production URL.
    *   [ ] Register a new test user.
    *   [ ] Submit a quote request with a valid address (e.g., "123 Main Street, Victoria, BC V8W 1A1").
    *   [ ] Verify the address geocoding works (should show "Address verified and located on map").
    *   [ ] Log in as the admin.
    *   [ ] Verify the new request appears in the Command Center with latitude/longitude data.
    *   [ ] Switch to Map View and verify the job appears as a pin on the map.
    *   [ ] Click the pin to see the job details info window.
    *   [ ] Create a quote.
    *   [ ] Verify the email notification was sent (check client's Resend logs).
*   **Schedule the 1-hour "Training & Handover Call."**
*   [ ] During the call, walk the client through the entire system.
*   [ ] Send a follow-up email with links to their live site, a reminder of their monthly costs, and an offer for an ongoing support/maintenance plan.
*   [ ] **Mark project as complete.**