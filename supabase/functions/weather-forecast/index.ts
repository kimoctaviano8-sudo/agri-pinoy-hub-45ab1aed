const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherApiResponse {
  timezone: string
  current_weather: {
    temperature: number
    weathercode: number
  } | null
}

interface WeatherResult {
  location: string;
  temperature: number;
  conditionEmoji: string;
  description: string;
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
    const { lat, lon } = await req.json();

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid latitude or longitude' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url.toString());
    if (!response.ok) {
      const text = await response.text();
      console.error('OpenWeatherMap error:', response.status, text);
      return new Response(JSON.stringify({ error: 'Weather API error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = (await response.json()) as WeatherApiResponse;
    const current = data.current_weather;

    if (!current) {
      console.error('Open-Meteo error: missing current_weather field', data);
      return new Response(JSON.stringify({ error: 'No current weather data available' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const getWeatherEmoji = (code: number) => {
      if (code === 0) return '☀️';
      if (code >= 1 && code <= 3) return '⛅';
      if (code >= 45 && code <= 48) return '🌫️';
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
      if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️';
      if (code >= 95) return '⛈️';
      return '🌤️';
    };

    const getWeatherDescription = (temp: number, code?: number) => {
      if (temp > 30) return 'Hot - Stay hydrated';
      if (temp > 25) return 'Perfect for farming';
      if (temp > 20) return 'Good for outdoor work';
      if (code && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))) return 'Rain expected';
      return 'Check conditions';
    };

    const result: WeatherResult = {
      location: data.timezone || 'Your location',
      temperature: current.temperature,
      conditionEmoji: getWeatherEmoji(current.weathercode),
      description: getWeatherDescription(current.temperature, current.weathercode),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Weather function error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch weather data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
