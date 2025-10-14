-- Check RLS status and policies for invoices table

-- 1. Check if RLS is enabled on invoices table
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'invoices';

-- 2. List all RLS policies on invoices table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY policyname;

-- 3. Check table owner and grants
SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'invoices'
ORDER BY grantee, privilege_type;

-- 4. Check foreign key relationship to requests table
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'invoices';

-- 5. Check if request_id column exists and its properties
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'invoices'
    AND column_name = 'request_id';
