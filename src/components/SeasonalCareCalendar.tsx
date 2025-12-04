import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { weatherTreatmentService } from '@/services/WeatherTreatmentService';

const SeasonalCareCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [seasonalData, setSeasonalData] = useState<{
    tips: string[];
    focus: string;
    diseases: string[];
  } | null>(null);

  useEffect(() => {
    loadSeasonalData();
  }, [currentMonth]);

  const loadSeasonalData = () => {
    const data = weatherTreatmentService.getSeasonalCare(currentMonth);
    setSeasonalData(data);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const getCurrentMonthName = () => months[currentMonth];

  const getSeasonIcon = (month: number) => {
    if (month >= 2 && month <= 4) return '🌱'; // Spring
    if (month >= 5 && month <= 7) return '☀️'; // Summer
    if (month >= 8 && month <= 10) return '🍂'; // Fall
    return '❄️'; // Winter
  };

  const getSeasonColor = (month: number) => {
    if (month >= 2 && month <= 4) return 'bg-green-50 border-green-200'; // Spring
    if (month >= 5 && month <= 7) return 'bg-yellow-50 border-yellow-200'; // Summer
    if (month >= 8 && month <= 10) return 'bg-orange-50 border-orange-200'; // Fall
    return 'bg-blue-50 border-blue-200'; // Winter
  };

  const getFocusColor = (month: number) => {
    if (month >= 2 && month <= 4) return 'text-green-700 bg-green-100'; // Spring
    if (month >= 5 && month <= 7) return 'text-yellow-700 bg-yellow-100'; // Summer
    if (month >= 8 && month <= 10) return 'text-orange-700 bg-orange-100'; // Fall
    return 'text-blue-700 bg-blue-100'; // Winter
  };

  if (!seasonalData) {
    return (
      <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Seasonal Care Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Leaf className="w-6 h-6 animate-pulse text-primary" />
            <span className="ml-2 text-muted-foreground">Loading seasonal care tips...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCurrentMonth = currentMonth === new Date().getMonth();

  return (
    <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Seasonal Care Calendar
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={goToPreviousMonth} 
            variant="outline" 
            size="sm"
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{getSeasonIcon(currentMonth)}</span>
              <h3 className="text-lg font-bold text-foreground">
                {getCurrentMonthName()}
              </h3>
              {isCurrentMonth && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            onClick={goToNextMonth} 
            variant="outline" 
            size="sm"
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Focus Area */}
        <div className={`p-4 rounded-xl border ${getSeasonColor(currentMonth)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5" />
            <span className="font-semibold text-foreground">Monthly Focus</span>
          </div>
          <Badge className={`${getFocusColor(currentMonth)} border-0`}>
            {seasonalData.focus}
          </Badge>
        </div>

        <Separator />

        {/* Care Tips */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            Care Tips for {getCurrentMonthName()}
          </h4>
          
          <div className="space-y-2">
            {seasonalData.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Disease Watch List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            Diseases to Watch For
          </h4>
          
          {seasonalData.diseases.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {seasonalData.diseases.map((disease, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {disease}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground bg-success/10 p-3 rounded-lg border border-success/20">
              ✅ Planning phase - No active disease concerns this month
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {isCurrentMonth && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">This Month's Priority</h4>
            <div className="text-xs text-blue-700">
              Focus on: <strong>{seasonalData.focus}</strong>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Check your plants for signs of {seasonalData.diseases.join(', ') || 'general health issues'}
            </div>
          </div>
        )}

        {/* Navigation Hint */}
        <div className="text-xs text-muted-foreground text-center">
          Use the arrows to browse care tips for different months
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonalCareCalendar;