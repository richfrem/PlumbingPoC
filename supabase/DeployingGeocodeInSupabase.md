# Deploying geocode for google in supabase
open cli in terminal
1. supabase login
2. supabase link
3. supabase functions deploy geocode
will say something like
Deployed Functions on project oxoiwzijacglgueemlva: geocode
You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/project/.../functions

4. Set Google Maps API Key in Supabase Secrets
You need to add your Google Maps API key to Supabase secrets. You can do this through the Supabase Dashboard:
Go to your project dashboard
Navigate to Settings → Edge Functions
Navigate to function secrets
https://supabase.com/dashboard/project/..../functions/secrets
Add a new secret:

5. create the external function in supabase.
code for function see supabase/supabase/functions/index.ts
call function "geocode"
note can delete with "supabase functions delete geocode" in cli
note can test new function in gui.
Go to your Supabase Dashboard: https://supabase.com/dashboard/project/.../functions
{
  "requestId": "0c4714f8-df2e-41f1-9f60-615b78613cb6"
} gives result {
  "success": true,
  "latitude": 48.4863665,
  "longitude": -123.3338452,
  "geocoded_address": "Victoria, BC V8N 2L4, Canada"
}

note can test new function via CLI curl command.
curl -X POST 'https://oxoiwzijacglgueemlva.supabase.co/functions/v1/geocode' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"requestId": "d1fde28a-2742-4c3a-8678-ee1e2143c713"}'

verify was updated coordinates in supabase from the function call

SELECT id, service_address, latitude, longitude, geocoded_address
FROM requests
WHERE id = '0c4714f8-df2e-41f1-9f60-615b78613cb6';

should give something like

[
  {
    "id": "0c4714f8-df2e-41f1-9f60-615b78613cb6",
    "service_address": "1555 San Jan St, Saanich, BC V8N-2L4",
    "latitude": 48.4863665,
    "longitude": -123.3338452,
    "geocoded_address": "Victoria, BC V8N 2L4, Canada"
  }
]



6. run this sql in supabase.  enable http extension for sql batch processing
to update all the existing client coordinates from google geo api.

-- Enable http extension
CREATE EXTENSION IF NOT EXISTS http;

-- Geocode all requests without coordinates
DO $$
DECLARE
    current_id TEXT;
    service_role_key TEXT := '$SUPABASE_SERVICE_ROLE_KEY'; -- Replace with your actual service role key or use env var
BEGIN
    FOR current_id IN
        SELECT id FROM requests
        WHERE latitude IS NULL OR longitude IS NULL
        ORDER BY created_at DESC -- Process newest first
    LOOP
        -- Call geocoding function (ignore response to avoid field errors)
        PERFORM http((
            'POST',
            'https://...supabase.co/functions/v1/geocode',
            ARRAY[
                http_header('Authorization', 'Bearer ' || service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            json_build_object('requestId', current_id)::text
        ));

        RAISE NOTICE 'Processed request %', current_id;
        PERFORM pg_sleep(0.2); -- Rate limiting to avoid overwhelming the API
    END LOOP;

    RAISE NOTICE 'Geocoding batch complete!';
END $$;

-- Alternative: Process in smaller batches for testing
DO $$
DECLARE
    current_id TEXT;
    service_role_key TEXT := '$SUPABASE_SERVICE_ROLE_KEY'; -- Replace with your actual service role key or use env var
    counter INTEGER := 0;
BEGIN
    FOR current_id IN
        SELECT id FROM requests
        WHERE latitude IS NULL OR longitude IS NULL
        ORDER BY created_at DESC
        LIMIT 10 -- Process only 10 at a time for testing
    LOOP
        PERFORM http((
            'POST',
            'https://oxoiwzijacglgueemlva.supabase.co/functions/v1/geocode',
            ARRAY[
                http_header('Authorization', 'Bearer ' || service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            json_build_object('requestId', current_id)::text
        ));

        counter := counter + 1;
        RAISE NOTICE 'Processed % requests', counter;
        PERFORM pg_sleep(0.2);
    END LOOP;
END $$;

7. run this sql to geocode user profiles (not requests)
-- Enable http extension for API calls
CREATE EXTENSION IF NOT EXISTS http;

-- Geocode specific user profiles from your list
DO $$
DECLARE
    current_id TEXT;
    service_role_key TEXT := '$SUPABASE_SERVICE_ROLE_KEY'; -- Replace with your actual service role key
    profile_ids TEXT[] := ARRAY[
        'd835339e-3752-4721-b0c8-e502c7986625',
        'c544f7e9-6f7c-40d6-a499-2430716e33ce',
        '55aea5b6-7bd5-4b10-8f37-229ac912e47f',
        '142ca005-d98e-4694-a78d-ad711456cd9a',
        'd8d2fc88-1a21-4b3b-9357-73a3f3ea0be0',
        'd3d63f36-2c01-42f4-9522-081d8df4cc98',
        'c3b0be81-e8be-44f5-856f-c85522ced738'
    ];
    i INTEGER := 1;
BEGIN
    -- Loop through each profile ID
    WHILE i <= array_length(profile_ids, 1) LOOP
        current_id := profile_ids[i];

        -- Call geocoding function for this profile
        PERFORM http((
            'POST',
            'https://oxoiwzijacglgueemlva.supabase.co/functions/v1/geocode',
            ARRAY[
                http_header('Authorization', 'Bearer ' || service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            json_build_object('profileId', current_id)::text
        ));

        RAISE NOTICE 'Geocoded profile %: %', i, current_id;
        PERFORM pg_sleep(0.2); -- Rate limiting

        i := i + 1;
    END LOOP;

    RAISE NOTICE 'All 7 user profiles geocoded successfully!';
END $$;

-- Alternative: Geocode ALL user profiles (not just specific ones)
DO $$
DECLARE
    current_id TEXT;
    service_role_key TEXT := '$SUPABASE_SERVICE_ROLE_KEY';
BEGIN
    FOR current_id IN
        SELECT id FROM user_profiles
        WHERE latitude IS NULL OR longitude IS NULL
        ORDER BY created_at DESC
    LOOP
        PERFORM http((
            'POST',
            'https://oxoiwzijacglgueemlva.supabase.co/functions/v1/geocode',
            ARRAY[
                http_header('Authorization', 'Bearer ' || service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            json_build_object('profileId', current_id)::text
        ));

        RAISE NOTICE 'Geocoded profile: %', current_id;
        PERFORM pg_sleep(0.2);
    END LOOP;
END $$;

8. verify user profiles geocoding worked
After running the SQL, you can verify the geocoding worked by checking:

-- Check specific profiles from your list
SELECT id, name, address, city, postal_code, latitude, longitude, geocoded_address
FROM user_profiles
WHERE id IN (
    'd835339e-3752-4721-b0c8-e502c7986625',
    'c544f7e9-6f7c-40d6-a499-2430716e33ce',
    '55aea5b6-7bd5-4b10-8f37-229ac912e47f',
    '142ca005-d98e-4694-a78d-ad711456cd9a',
    'd8d2fc88-1a21-4b3b-9357-73a3f3ea0be0',
    'd3d63f36-2c01-42f4-9522-081d8df4cc98',
    'c3b0be81-e8be-44f5-856f-c85522ced738'
);

-- Check all geocoded profiles
SELECT id, name, address, city, postal_code, latitude, longitude, geocoded_address
FROM user_profiles
WHERE latitude IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
