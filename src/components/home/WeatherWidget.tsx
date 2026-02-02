import { MapPin, Droplets, CloudRain, Gauge, Wind, Sunrise, Sunset } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WeatherData {
  location: string;
  temperature: string;
  temperatureHigh: string;
  temperatureLow: string;
  humidity: string;
  precipitation: string;
  pressure: string;
  windSpeed: string;
  sunrise: string;
  sunset: string;
  condition: string;
  description: string;
}

interface WeatherWidgetProps {
  weather: WeatherData;
}

export const WeatherWidget = ({ weather }: WeatherWidgetProps) => {
  return (
    <Card className="bg-card shadow-lg border-0 -mt-6 mx-4 relative z-10">
      <CardContent className="p-4">
        {/* Location and Main Temperature */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{weather.location}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                {weather.temperature}°C
              </span>
              <span className="text-lg">{weather.condition}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              H: {weather.temperatureHigh}° L: {weather.temperatureLow}°
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl">{weather.condition}</span>
            <p className="text-xs text-muted-foreground mt-1">{weather.description}</p>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-4 gap-3 py-3 border-t border-b border-border">
          <div className="text-center">
            <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className="text-sm font-semibold">{weather.humidity}%</p>
          </div>
          <div className="text-center">
            <CloudRain className="w-4 h-4 mx-auto mb-1 text-sky-500" />
            <p className="text-xs text-muted-foreground">Precip</p>
            <p className="text-sm font-semibold">{weather.precipitation}mm</p>
          </div>
          <div className="text-center">
            <Gauge className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <p className="text-xs text-muted-foreground">Pressure</p>
            <p className="text-sm font-semibold">{weather.pressure}hPa</p>
          </div>
          <div className="text-center">
            <Wind className="w-4 h-4 mx-auto mb-1 text-teal-500" />
            <p className="text-xs text-muted-foreground">Wind</p>
            <p className="text-sm font-semibold">{weather.windSpeed}m/s</p>
          </div>
        </div>

        {/* Sunrise and Sunset */}
        <div className="flex justify-between items-center pt-3">
          <div className="flex items-center gap-2">
            <Sunrise className="w-4 h-4 text-orange-400" />
            <div>
              <p className="text-xs text-muted-foreground">Sunrise</p>
              <p className="text-sm font-semibold">{weather.sunrise}</p>
            </div>
          </div>
          <div className="flex-1 mx-4">
            <div className="h-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-full opacity-50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sunset</p>
              <p className="text-sm font-semibold">{weather.sunset}</p>
            </div>
            <Sunset className="w-4 h-4 text-orange-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
