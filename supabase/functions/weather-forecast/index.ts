const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherApiResponse {
  timezone: string;
  current_weather: {
    temperature: number;
    weathercode: number;
  } | null;
  daily?: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly?: {
    relative_humidity_2m: number[];
    precipitation: number[];
    surface_pressure: number[];
    wind_speed_10m: number[];
  };
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
  temperatureHigh: number;
  temperatureLow: number;
  humidity: number;
  precipitation: number;
  pressure: number;
  windSpeed: number;
  sunrise: string;
  sunset: string;
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

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return '--:--';
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

    // Fetch weather with enhanced data and location name in parallel
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', String(lat));
    weatherUrl.searchParams.set('longitude', String(lon));
    weatherUrl.searchParams.set('current_weather', 'true');
    weatherUrl.searchParams.set('timezone', 'auto');
    weatherUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,sunrise,sunset');
    weatherUrl.searchParams.set('hourly', 'relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m');
    weatherUrl.searchParams.set('forecast_days', '1');

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

    // Get current hour index for hourly data
    const currentHour = new Date().getHours();

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

    // Extract enhanced weather data
    const temperatureHigh = data.daily?.temperature_2m_max?.[0] ?? current.temperature;
    const temperatureLow = data.daily?.temperature_2m_min?.[0] ?? current.temperature;
    const humidity = data.hourly?.relative_humidity_2m?.[currentHour] ?? 0;
    const precipitation = data.hourly?.precipitation?.[currentHour] ?? 0;
    const pressure = data.hourly?.surface_pressure?.[currentHour] ?? 0;
    const windSpeed = data.hourly?.wind_speed_10m?.[currentHour] ?? 0;
    const sunrise = data.daily?.sunrise?.[0] ? formatTime(data.daily.sunrise[0]) : '--:--';
    const sunset = data.daily?.sunset?.[0] ? formatTime(data.daily.sunset[0]) : '--:--';

    const result: WeatherResult = {
      location: locationName,
      temperature: current.temperature,
      temperatureHigh: Math.round(temperatureHigh),
      temperatureLow: Math.round(temperatureLow),
      humidity: Math.round(humidity),
      precipitation: Math.round(precipitation * 10) / 10,
      pressure: Math.round(pressure),
      windSpeed: Math.round(windSpeed * 10) / 10,
      sunrise,
      sunset,
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
