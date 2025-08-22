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
   - id (uuid, primary key)
   - user_id (uuid, unique, references auth)
   - name (text)
   - email (text)
   - phone (text)
   - address (text)
   - city (text)
   - province (text)
   - postal_code (text)
   - created_at (timestamp with time zone)

- **requests**
   - id (uuid, primary key)
   - created_at (timestamp with time zone)
   - is_emergency (boolean)
   - customer_name (text)
   - service_address (text)
   - contact_info (text)
   - problem_category (text)
   - problem_description (text)
   - property_type (text)
   - is_homeowner (boolean)
   - preferred_timing (text)
   - additional_notes (text)
   - answers (jsonb)  # stores all questions and answers in JSON format
   - status (text)

- **quotes**
   - id (uuid, primary key)
   - user_id (uuid)
   - request_id (uuid, foreign key → requests.id)  # links quote to the original request
   - quote_amount (numeric)
   - status (text)
   - created_at (timestamp with time zone)

- **invoices**
   - id (uuid, primary key)
   - user_id (uuid)
   - quote_id (uuid, foreign key → quotes.id)
   - amount_due (numeric)
   - due_date (timestamp with time zone)
   - status (text)
   - created_at (timestamp with time zone)

- **quote_attachments**
   - id (uuid, primary key)
   - request_id (uuid, foreign key → requests.id)
   - file_url (text)
   - file_name (text)
   - mime_type (text)
   - uploaded_at (timestamp with time zone)
### Row Level Security (RLS) Policies

- **requests**
   - Users can delete their own requests (DELETE, authenticated)
   - Users can update their own requests (UPDATE, authenticated)
   - Users can insert requests (INSERT, authenticated)
   - Users can view all requests (SELECT, authenticated)
   - All policies are permissive and allow authenticated users to perform these actions.

- **user_profiles**
   - Allow authenticated users to select their own profile
      - Expression: `user_id = auth.uid()`
      - Action: SELECT
      - Enabled: Yes

### Supabase Storage Bucket
**PlumbingPoCBucket**
   - Used for storing quote attachments (images, PDFs, etc.)
   - Allowed MIME types: image/jpeg, image/png, application/pdf
   - Files are linked to quote requests via the `quote_attachments` table

#### Example Storage RLS Policies (GUI-generated syntax)

```
CREATE POLICY "Enable insert for authenticated users only" ON "storage"."objects"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users only" ON "storage"."objects"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users only" ON "storage"."objects"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON "storage"."objects"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);
```

You can further restrict access by adding conditions (e.g., bucket_id, owner) as needed in the GUI.

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

### supabase cli
-- npx supabase login
-- npx supabase link

### install supabase on macos
brew install supabase/tap/supabase
supabase --version

### supabase database dump
export PGPASSWORD='YOUR_PASSWORD'
pg_dump 'postgresql://PlumbingPoC@oxoiwzijacglgueemlva.supabase.co:5432/postgres' --schema-only --file="supabase_schema_audit.sql"

### Query 1: Table & Column Schema
SELECT 
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM 
    information_schema.columns c
WHERE 
    c.table_schema = 'public'
ORDER BY 
    c.table_name, 
    c.ordinal_position;

### Query 2: Row Level Security (RLS) Policies
SELECT
    p.schemaname AS schema_name,
    p.tablename AS table_name,
    p.policyname AS policy_name,
    p.permissive,
    p.cmd AS command_type,
    p.qual AS policy_expression,
    p.with_check AS with_check_expression
FROM
    pg_policies p
WHERE
    p.schemaname = 'public'
ORDER BY
    p.tablename,
    p.policyname;

### Query 3: Storage Buckets & Policies

SELECT 
    id,
    name,
    public,
    avif_autodetection,
    file_size_limit,
    allowed_mime_types
FROM 
    storage.buckets;


_Last updated: August 21, 2025_
