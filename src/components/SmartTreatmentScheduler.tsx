import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { weatherTreatmentService, type TreatmentRecommendation, type ForecastData } from '@/services/WeatherTreatmentService';
import { useToast } from '@/hooks/use-toast';

interface SmartTreatmentSchedulerProps {
  disease?: string;
}

const SmartTreatmentScheduler: React.FC<SmartTreatmentSchedulerProps> = ({ disease }) => {
  const [recommendation, setRecommendation] = useState<TreatmentRecommendation | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string>('Getting location...');
  const { toast } = useToast();

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const userLocation = await weatherTreatmentService.getUserLocation();
      const forecastData = await weatherTreatmentService.getWeatherForecast(
        userLocation.lat,
        userLocation.lon
      );
      
      const treatmentRec = weatherTreatmentService.analyzeTreatmentTiming(forecastData);
      
      setForecast(forecastData);
      setRecommendation(treatmentRec);
      setLocation('Current Location');
    } catch (error) {
      console.error('Error loading weather data:', error);
      toast({
        title: "Weather Data Error",
        description: "Unable to load weather data for treatment recommendations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Treatment Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading weather data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation || !forecast) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Treatment Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            Unable to load weather data for treatment recommendations.
          </p>
          <Button onClick={loadWeatherData} className="w-full" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentWeather = forecast.hourly[0];

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Smart Treatment Scheduler
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {location}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Recommendation */}
        <div className={`p-4 rounded-xl border-l-4 ${
          recommendation.canSprayNow 
            ? 'bg-green-50 border-green-500' 
            : 'bg-yellow-50 border-yellow-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{recommendation.icon}</span>
            <Badge variant={getUrgencyBadgeVariant(recommendation.urgency)}>
              {recommendation.urgency.toUpperCase()}
            </Badge>
          </div>
          <p className="font-semibold text-gray-800 mb-1">
            {recommendation.recommendation}
          </p>
          {recommendation.waitReason && (
            <p className="text-sm text-gray-600">
              Reason: {recommendation.waitReason}
            </p>
          )}
          {recommendation.nextOptimalWindow && (
            <p className="text-sm text-blue-600 mt-2">
              Next optimal window: {formatTime(recommendation.nextOptimalWindow)}
            </p>
          )}
        </div>

        <Separator />

        {/* Current Conditions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Temperature</div>
            <div className="text-lg font-bold text-blue-800">
              {Math.round(currentWeather.temperature)}°C
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Humidity</div>
            <div className="text-lg font-bold text-blue-800">
              {currentWeather.humidity}%
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Wind Speed</div>
            <div className="text-lg font-bold text-blue-800">
              {Math.round(currentWeather.wind_speed)} m/s
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Precipitation</div>
            <div className="text-lg font-bold text-blue-800">
              {currentWeather.precipitation.toFixed(1)} mm
            </div>
          </div>
        </div>

        {/* Quick Forecast */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-sm">Next 12 Hours</h4>
          <div className="grid grid-cols-4 gap-2">
            {forecast.hourly.slice(0, 4).map((hour, index) => (
              <div key={index} className="text-center bg-gray-50 p-2 rounded-lg">
                <div className="text-xs text-gray-600">
                  {formatTime(hour.timestamp)}
                </div>
                <div className="text-sm font-medium">
                  {Math.round(hour.temperature)}°
                </div>
                <div className="text-xs text-blue-600">
                  {hour.precipitation > 0.1 ? `${hour.precipitation.toFixed(1)}mm` : 'Dry'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {disease && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-sm font-medium text-amber-800 mb-1">
              Treatment for: {disease}
            </div>
            <div className="text-xs text-amber-700">
              Weather conditions specifically analyzed for this disease type
            </div>
          </div>
        )}

        <Button 
          onClick={loadWeatherData} 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Refresh Weather Data
        </Button>
      </CardContent>
    </Card>
  );
};

export default SmartTreatmentScheduler;