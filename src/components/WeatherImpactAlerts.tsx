import { useState, useEffect } from 'react';
import { AlertTriangle, Thermometer, Droplets, Wind, TrendingUp, Info, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { weatherTreatmentService, type WeatherImpact, type WeatherData } from '@/services/WeatherTreatmentService';
import { useToast } from '@/hooks/use-toast';

interface WeatherImpactAlertsProps {
  disease: string;
}

const WeatherImpactAlerts: React.FC<WeatherImpactAlertsProps> = ({ disease }) => {
  const [weatherImpact, setWeatherImpact] = useState<WeatherImpact | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWeatherImpact();
  }, [disease]);

  const loadWeatherImpact = async () => {
    setLoading(true);
    try {
      const userLocation = await weatherTreatmentService.getUserLocation();
      const weatherData = await weatherTreatmentService.getCurrentWeather(
        userLocation.lat,
        userLocation.lon
      );
      
      const impact = weatherTreatmentService.analyzeWeatherImpact(disease, weatherData);
      
      setCurrentWeather(weatherData);
      setWeatherImpact(impact);
    } catch (error) {
      console.error('Error loading weather impact:', error);
      // Silently fail with a default state instead of showing error
      setWeatherImpact(null);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'humidity': return <Droplets className="w-4 h-4" />;
      case 'temperature': return <Thermometer className="w-4 h-4" />;
      case 'precipitation': return <Wind className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getFactorProgress = (factor: string, level: number) => {
    switch (factor) {
      case 'humidity': return level;
      case 'temperature': return Math.min((level / 40) * 100, 100);
      case 'precipitation': return Math.min((level / 10) * 100, 100);
      default: return 0;
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Weather Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-warning" />
            <span className="ml-2 text-muted-foreground">Analyzing weather impact...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherImpact || !currentWeather) {
    return (
      <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Weather Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Unable to analyze weather impact for disease risk.
          </p>
          <Button onClick={loadWeatherImpact} className="w-full" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Weather Impact Analysis
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Disease: {weatherImpact.disease}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Risk Level */}
        <div className={`p-4 rounded-xl border ${getRiskColor(weatherImpact.currentRisk)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Current Disease Risk</span>
            </div>
            <Badge variant={getRiskBadgeVariant(weatherImpact.currentRisk)}>
              {weatherImpact.currentRisk.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm opacity-90">
            {weatherImpact.advice}
          </p>
        </div>

        <Separator />

        {/* Weather Factors */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground text-sm">Contributing Factors</h4>
          
          {Object.entries(weatherImpact.factors).map(([factorName, factor]) => (
            <div key={factorName} className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getFactorIcon(factorName)}
                  <span className="font-medium text-sm capitalize">{factorName}</span>
                </div>
                <span className="text-sm font-bold">
                  {factor.level}{factorName === 'humidity' ? '%' : factorName === 'temperature' ? '°C' : 'mm'}
                </span>
              </div>
              
              <Progress 
                value={getFactorProgress(factorName, factor.level)} 
                className="h-2 mb-2"
              />
              
              <div className="text-xs text-muted-foreground">
                Impact: {factor.impact}
              </div>
            </div>
          ))}
        </div>

        {/* Specific Recommendations */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <h4 className="font-semibold text-primary mb-2 text-sm">Recommendations</h4>
          <div className="space-y-2 text-xs text-foreground">
            {weatherImpact.currentRisk === 'high' && (
              <>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Apply preventive treatments immediately</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Increase monitoring frequency to daily checks</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Improve air circulation around plants</span>
                </div>
              </>
            )}
            
            {weatherImpact.currentRisk === 'medium' && (
              <>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Consider preventive spray applications</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Monitor plants every 2-3 days</span>
                </div>
              </>
            )}
            
            {weatherImpact.currentRisk === 'low' && (
              <>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Continue regular monitoring schedule</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Focus on plant health maintenance</span>
                </div>
              </>
            )}
          </div>
        </div>

        <Button 
          onClick={loadWeatherImpact} 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Update Analysis
        </Button>
      </CardContent>
    </Card>
  );
};

export default WeatherImpactAlerts;