# How to Configure Resend for Email Sending on Netlify

When your domain's nameservers point to Netlify, all DNS records (including those required by third-party services such as Resend) must be created and managed in the Netlify DNS UI. Do **not** attempt to add these records at your domain registrar (for example, Namecheap) because changes there will be ignored while Netlify is authoritative for DNS.

## Prerequisites

- Access to the Netlify account that manages your domain (site owner or team member with DNS edit permissions).
- Access to the Resend dashboard and the `Domains` section for your Resend account.
- The domain already added to Netlify and the Netlify nameservers configured at your registrar (this project uses `CopilotForTrades.com`).
- A short propagation window allowance (DNS changes can take minutes to hours to propagate).

## Step-by-Step Configuration

### Step 1 — Get the DNS records from Resend

1. Sign in to the Resend dashboard.
2. Open `Domains` and select your domain (e.g., `CopilotForTrades.com`).
3. Copy the DNS records Resend lists for `MX`, `TXT` (SPF), `TXT` (DKIM), and `_dmarc`.

### Step 2 — Open the Netlify DNS panel for your domain

1. Sign in to Netlify and open your site.
2. Go to `Domains` and click the domain name (`CopilotForTrades.com`).
3. Open the `DNS` panel where you can view and add DNS records.

### Step 3 — Add the records to Netlify

1. Click `Add new record` for each record Resend provided.
2. For each record, paste the `Type`, `Name` (Netlify's Name field), and `Value` exactly as Resend shows them.
3. For `MX` records, set the `Priority` field as instructed.
4. Save each record. Repeat until all required records are added.

## Required DNS Records for `CopilotForTrades.com`

Add the following records in Netlify's DNS editor for `CopilotForTrades.com`.

| Type | Name (in Netlify) | Value (in Netlify) | Priority (for MX) |
|------|-------------------|--------------------|-------------------|
| `MX` | `send` | `feedback-smtp.us-east-1.amazonses.com` | `10` |
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | `N/A` |
| `TXT` | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCnFve...` (the full DKIM key) | `N/A` |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` | `N/A` |

> Note: Replace the truncated DKIM value above with the full, long key exactly as Resend provides. The DKIM entry typically begins with `p=` and is a long base64-encoded string.

## Verification

After adding all records in Netlify:

1. Return to the Resend dashboard `Domains` section for `CopilotForTrades.com`.
2. Click the `Verify Records` button.
3. Wait for Resend to report verification success. DNS propagation can take from a few minutes up to 48 hours depending on DNS caches.

If verification fails after an hour, re-check that:

- The `Name` fields match exactly (Netlify's `Name` should be `send`, `resend._domainkey`, or `_dmarc` as appropriate).
- The `Value` strings are copied exactly, with no extra quotes or missing characters.
- The `MX` priority is set to `10` for the `send` record.

If you still cannot verify, open a support ticket with Resend and include the DNS records screenshots from Netlify.

---

If you'd like, I can create a short script or a checklist to export Netlify DNS records for auditing, or add an entry to `docs/OPS.md` showing who owns the registrar and Netlify accounts and where to find MFA/contact info.
