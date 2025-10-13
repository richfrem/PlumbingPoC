-- Quick check for invoices table RLS and permissions
-- Run each query separately in Supabase SQL Editor

-- Query 1: Is RLS enabled?
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'invoices';

-- Query 2: What RLS policies exist?
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'invoices';

-- Query 3: Does request_id column exist?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'request_id';
