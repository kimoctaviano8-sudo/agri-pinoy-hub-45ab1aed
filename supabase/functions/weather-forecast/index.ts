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

interface GeocodingResult {
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  display_name?: string;
}

interface WeatherResult {
  location: string;
  temperature: number;
  conditionEmoji: string;
  description: string;
}

async function getLocationName(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeminiAgri/1.0 (Agricultural App)',
        'Accept-Language': 'en'
      }
    });

    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return 'Your location';
    }

    const data: GeocodingResult = await response.json();
    
    if (data.address) {
      // Priority: city > town > municipality > village > suburb > county
      const locationName = 
        data.address.city || 
        data.address.town || 
        data.address.municipality || 
        data.address.village ||
        data.address.suburb ||
        data.address.county ||
        data.address.state;
      
      if (locationName) {
        return locationName;
      }
    }

    return 'Your location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Your location';
  }
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

    // Fetch weather and location name in parallel
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', String(lat));
    weatherUrl.searchParams.set('longitude', String(lon));
    weatherUrl.searchParams.set('current_weather', 'true');
    weatherUrl.searchParams.set('timezone', 'auto');

    const [weatherResponse, locationName] = await Promise.all([
      fetch(weatherUrl.toString()),
      getLocationName(lat, lon)
    ]);

    if (!weatherResponse.ok) {
      const text = await weatherResponse.text();
      console.error('Open-Meteo error:', weatherResponse.status, text);
      return new Response(JSON.stringify({ error: 'Weather API error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = (await weatherResponse.json()) as WeatherApiResponse;
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
      location: locationName,
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
