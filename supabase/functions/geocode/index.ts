// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface GeocodeRequest {
  address?: string;
  requestId?: string;x
  profileId?: string;
}

interface GeocodeResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  error?: string;
}

console.info('Universal geocoding function started');

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { address, requestId, profileId }: GeocodeRequest = await req.json();

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Google Maps API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let targetAddress = address;
    let updateTable = '';
    let updateId = '';

    // Determine what to geocode based on input
    if (requestId) {
      // Geocode for a request
      const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/requests?id=eq.${requestId}&select=service_address`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });

      if (!fetchResponse.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch request' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const requests = await fetchResponse.json();
      if (!requests || requests.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Request not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      targetAddress = requests[0].service_address;
      updateTable = 'requests';
      updateId = requestId;
    } else if (profileId) {
      // Geocode for a user profile
      const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${profileId}&select=address,city,province,postal_code`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });

      if (!fetchResponse.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch profile' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const profiles = await fetchResponse.json();
      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Profile not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const profile = profiles[0];
      targetAddress = `${profile.address}, ${profile.city}, ${profile.province} ${profile.postal_code}`;
      updateTable = 'user_profiles';
      updateId = profileId;
    } else if (!address) {
      return new Response(JSON.stringify({ success: false, error: 'Either address, requestId, or profileId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!targetAddress) {
      return new Response(JSON.stringify({ success: false, error: 'No address found to geocode' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call Google Maps Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(targetAddress)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Geocoding failed: ${data.status}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = data.results[0];
    const location = result.geometry.location;
    const formattedAddress = result.formatted_address;

    // Update the appropriate table
    if (updateTable && updateId) {
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/${updateTable}?id=eq.${updateId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          geocoded_address: formattedAddress
        })
      });

      if (!updateResponse.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to update record' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const res: GeocodeResponse = {
      success: true,
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress,
    };

    return new Response(JSON.stringify(res), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});