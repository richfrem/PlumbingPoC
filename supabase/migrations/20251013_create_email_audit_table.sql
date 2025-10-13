-- Migration: create email_audit table with RLS and admin SELECT policy
-- Created: 2025-10-13

-- Create table
CREATE TABLE IF NOT EXISTS public.email_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL,
  recipient text,
  resend_message_id text,
  provider_response jsonb,
  status text NOT NULL DEFAULT 'sent'
);

-- Helpful index for lookups by request
CREATE INDEX IF NOT EXISTS idx_email_audit_request_id ON public.email_audit(request_id);

-- Enable Row Level Security so client-side access can be controlled
ALTER TABLE public.email_audit ENABLE ROW LEVEL SECURITY;

-- Remove any existing policy of the same name, then create admin-select policy
DROP POLICY IF EXISTS allow_admin_select_on_email_audit ON public.email_audit;

CREATE POLICY allow_admin_select_on_email_audit
  ON public.email_audit
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  );
