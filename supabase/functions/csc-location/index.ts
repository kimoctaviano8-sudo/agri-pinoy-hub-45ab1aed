const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CscRequestBody {
  type: 'states' | 'cities';
  countryCode: string;
  stateCode?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as CscRequestBody;
    const { type, countryCode, stateCode } = body;

    if (!type || !countryCode || (type === 'cities' && !stateCode)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('CSC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Location API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = 'https://api.countrystatecity.in/v1';
    let path: string;

    if (type === 'states') {
      path = `/countries/${encodeURIComponent(countryCode)}/states`;
    } else {
      path = `/countries/${encodeURIComponent(countryCode)}/states/${encodeURIComponent(
        stateCode as string,
      )}/cities`;
    }

    const response = await fetch(baseUrl + path, {
      headers: {
        'X-CSCAPI-KEY': apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('CSC API error:', response.status, text);
      return new Response(JSON.stringify({ error: 'Location API error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('CSC proxy error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch locations' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
