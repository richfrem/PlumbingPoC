-- Fix RLS policy for quotes to allow real-time updates for users
-- The problem: conflicting policies prevent users from receiving real-time updates
-- when admins add quotes to their requests

-- Drop the restrictive policy that prevents users from seeing quotes on their requests
DROP POLICY "Enable read for own quotes" ON "public"."quotes";

-- The "Enable read for request owners" policy should remain and handle user access correctly
-- This policy allows users to read quotes where they own the associated request

-- Verify the remaining policy exists (should show the request owners policy)
-- You can run: SELECT * FROM pg_policies WHERE tablename = 'quotes' AND schemaname = 'public';