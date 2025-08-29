-- 1. Drop the helper function if you created it.
DROP FUNCTION IF EXISTS get_my_claim(TEXT);

-- 2. Drop the separate SELECT policies just in case they are still around.
DROP POLICY IF EXISTS "Allow individual users to view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON public.user_profiles;

-- 3. **CRITICAL FIX:** Drop the consolidated policy IF IT EXISTS before creating it.
DROP POLICY IF EXISTS "Enable read access for users and admins" ON public.user_profiles;

-- 4. Create the ONE consolidated SELECT policy that handles both cases.
CREATE POLICY "Enable read access for users and admins"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- CASE 1: The logged-in user is requesting their OWN profile.
  (auth.uid() = user_id)
  
  OR
  
  -- CASE 2: The logged-in user is an admin.
  ((auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'admin')
);