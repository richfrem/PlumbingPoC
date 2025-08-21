# Table of Contents

1. [Supabase Database Configuration](#1-supabase-database-configuration)
2. [Authentication Provider Configuration](#2-authentication-provider-configuration)
    - [Updating URLs](#2a-updating-urls)
    - [Adding Authentication Providers](#2b-adding-authentication-providers)
    - [Configuring Applications for OAuth](#2c-configuring-applications-for-oauth)
       - [Google OAuth2 Client Setup](#google-oauth2-client-setup-google-cloud-console)
       - [Azure Entra App Registration](#azure-entra-app-registration-microsoft-entra-admin-center)
3. [Troubleshooting](#3-troubleshooting)

#

# Supabase & Authentication Provider Setup Reference

## 1. Supabase Database Configuration

### Tables Created
- **user_profiles**
  - user_id (uuid, primary key)
  - name (text)
  - email (text)
  - phone (text)
  - address (text)
  - city (text)
  - postal_code (text)
- **requests**
- **quotes**
- **invoices**

### Row Level Security (RLS) Policies
- **user_profiles**: Allow authenticated users to select their own profile
  - Expression: `user_id = auth.uid()`
  - Action: SELECT
  - Enabled: Yes

## 2. Authentication Provider Configuration

### 2a. Updating URLs
- Set Site URL for local development: `http://localhost:3000` or `http://localhost:5173/`
- Add Redirect URLs:
  - `http://localhost:3000/*`
  - `http://localhost:5173/`
- Save changes in Supabase dashboard under Authentication → URL Configuration.

### 2b. Adding Authentication Providers
- Go to Supabase dashboard → Authentication → Providers
- Enable and configure each provider (Google, Azure)

### 2c. Configuring Applications for OAuth

#### Google OAuth2 Client Setup (Google Cloud Console)
1. Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID.
2. Choose "Web application" as the application type.
3. Set the name (e.g., PlumbingPoCClient).
4. Add Authorized redirect URI:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. (Optional) Add Authorized JavaScript origins for local development:
   - `http://localhost:3000`
   - `http://localhost:5173`
6. Save and copy the Client ID and Client Secret.
7. Enter these values in Supabase dashboard under Authentication → Providers → Google.
8. Ensure the following scopes are enabled in Google:
   - `email`
   - `profile`
   - `openid`
9. Save changes in both Supabase and Google Cloud Console.

URL:  https://console.cloud.google.com/auth/clients/287129746720-a0thtekpior3iqdq67a31go02r6p945p.apps.googleusercontent.com?project=plumbingpoc


#### Azure Entra App Registration (Microsoft Entra Admin Center)
1. Register a new app in Microsoft Entra admin center.
2. Set the Redirect URI:
   - Platform: Web
   - URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
3. Certificates & Secrets:
   - Create a new client secret and copy the value.
4. API Permissions:
    - Microsoft Graph → Delegated permissions:
       - `openid` (required for authentication)
       - `email` (required to get user's email)
       - `User.Read` (required to read user profile info)
    - Click "Grant admin consent" for your directory to ensure all permissions are active.
5. Token Configuration (Optional Claims):
    - Go to "Token configuration" in Azure portal.
    - Add an optional claim for `email` in the ID token:
       - Click "Add optional claim" → ID token → select `email`.
       - Confirm the claim appears in the list as shown in the Azure portal.
       - This ensures the user's email is included in the token sent to Supabase.
    - (Status: claim added as of August 21, 2025)
6. Branding & Properties:
   - Set app name and logo as desired.
7. Enter Azure Client ID and Client Secret in Supabase dashboard under Authentication → Providers → Azure.
8. Save changes in both Supabase and Azure portal.

URL:  https://entra.microsoft.com/?culture=en-us&country=us#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/d9c00059-056f-4ab3-93c6-ea7009c00f23/isMSAApp~/false

## 3. Troubleshooting
- Ensure all permissions are granted and consented.
- Make sure the client secret is valid and matches Supabase.
- Confirm the redirect URI is identical in both provider and Supabase.
- For Google, ensure `email` scope is enabled.
- For Microsoft, ensure `openid`, `email`, and `profile` scopes are enabled.

---
_Last updated: August 21, 2025_
