// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface GeocodeRequest {
  requestId: string;
}

interface GeocodeResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  geocoded_address?: string;
  error?: string;
}

console.info('Geocoding function started');

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { requestId }: GeocodeRequest = await req.json();

    if (!requestId) {
      return new Response(
        JSON.stringify({ success: false, error: 'requestId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')!;

    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Maps API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the request from database
    const fetchRequestResponse = await fetch(`${supabaseUrl}/rest/v1/requests?id=eq.${requestId}&select=service_address`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    if (!fetchRequestResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch request' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const requests = await fetchRequestResponse.json();

    if (!requests || requests.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Request not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const serviceAddress = requests[0].service_address;

    if (!serviceAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'No service address found' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Google Maps Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(serviceAddress)}&key=${googleMapsApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Geocoding failed: ${geocodeData.status}`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const location = geocodeData.results[0].geometry.location;
    const geocodedAddress = geocodeData.results[0].formatted_address;

    // Update the request in database
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/requests?id=eq.${requestId}`, {
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
        geocoded_address: geocodedAddress
      })
    });

    if (!updateResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update request' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const response: GeocodeResponse = {
      success: true,
      latitude: location.lat,
      longitude: location.lng,
      geocoded_address: geocodedAddress
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
