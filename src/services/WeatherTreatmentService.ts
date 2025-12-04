interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  condition: string;
  timestamp: Date;
}

interface ForecastData {
  hourly: WeatherData[];
  daily: WeatherData[];
}

interface TreatmentRecommendation {
  canSprayNow: boolean;
  nextOptimalWindow: Date | null;
  waitReason: string | null;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
  icon: string;
}

interface WeatherImpact {
  disease: string;
  currentRisk: 'low' | 'medium' | 'high';
  factors: {
    humidity: { level: number; impact: string };
    temperature: { level: number; impact: string };
    precipitation: { level: number; impact: string };
  };
  advice: string;
}

class WeatherTreatmentService {
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    console.warn('WeatherTreatmentService: external weather API disabled, returning mocked data');
    const now = new Date();

    return {
      temperature: 28,
      humidity: 70,
      wind_speed: 3,
      precipitation: 0,
      condition: 'Clear',
      timestamp: now,
    };
  }

  async getWeatherForecast(lat: number, lon: number): Promise<ForecastData> {
    console.warn('WeatherTreatmentService: external weather API disabled, returning mocked forecast');
    const now = new Date();

    const hourly: WeatherData[] = Array.from({ length: 24 }, (_, index) => ({
      temperature: 26 + Math.sin(index / 3) * 2,
      humidity: 65 + (index % 5),
      wind_speed: 2 + (index % 3),
      precipitation: 0,
      condition: 'Clear',
      timestamp: new Date(now.getTime() + index * 60 * 60 * 1000),
    }));

    const daily: WeatherData[] = Array.from({ length: 5 }, (_, index) => ({
      temperature: 27,
      humidity: 68,
      wind_speed: 3,
      precipitation: 0,
      condition: 'Clear',
      timestamp: new Date(now.getTime() + index * 24 * 60 * 60 * 1000),
    }));

    return { hourly, daily };
  }

  private processDailyForecast(forecastList: any[]): WeatherData[] {
    const dailyMap = new Map<string, any[]>();
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(item);
    });

    return Array.from(dailyMap.entries()).map(([date, items]) => {
      const temps = items.map(item => item.main.temp);
      const humidities = items.map(item => item.main.humidity);
      const totalPrecip = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
      
      return {
        temperature: Math.round(temps.reduce((sum, temp) => sum + temp, 0) / temps.length),
        humidity: Math.round(humidities.reduce((sum, hum) => sum + hum, 0) / humidities.length),
        wind_speed: items[0].wind.speed,
        precipitation: totalPrecip,
        condition: items[0].weather[0].main,
        timestamp: new Date(date)
      };
    });
  }

  analyzeTreatmentTiming(forecast: ForecastData): TreatmentRecommendation {
    const currentWeather = forecast.hourly[0];
    const next6Hours = forecast.hourly.slice(0, 6);
    const next24Hours = forecast.hourly.slice(0, 24);

    // Check for rain in next 6 hours
    const rainInNext6Hours = next6Hours.some(hour => hour.precipitation > 0.1);
    const rainInNext24Hours = next24Hours.some(hour => hour.precipitation > 0.5);

    // Check current conditions
    const isWindyTooMuch = currentWeather.wind_speed > 10; // m/s
    const isTooHot = currentWeather.temperature > 35;
    const isTooHumid = currentWeather.humidity > 90;

    if (rainInNext6Hours) {
      const hoursUntilClear = this.findNextClearWindow(forecast.hourly);
      return {
        canSprayNow: false,
        nextOptimalWindow: hoursUntilClear.window,
        waitReason: "Rain expected soon",
        recommendation: `⏰ Wait ${hoursUntilClear.hours} hours - rain expected`,
        urgency: 'medium',
        icon: '🌧️'
      };
    }

    if (isWindyTooMuch) {
      return {
        canSprayNow: false,
        nextOptimalWindow: this.findLowWindWindow(forecast.hourly),
        waitReason: "Wind too strong for effective application",
        recommendation: "💨 Wait for calmer conditions - wind too strong",
        urgency: 'low',
        icon: '💨'
      };
    }

    if (isTooHot) {
      return {
        canSprayNow: false,
        nextOptimalWindow: this.findCoolerWindow(forecast.hourly),
        waitReason: "Temperature too high - risk of leaf burn",
        recommendation: "🌡️ Wait for cooler temperature - risk of leaf burn",
        urgency: 'high',
        icon: '🌡️'
      };
    }

    if (isTooHumid) {
      return {
        canSprayNow: true,
        nextOptimalWindow: null,
        waitReason: null,
        recommendation: "⚠️ Spray with caution - high humidity may reduce effectiveness",
        urgency: 'medium',
        icon: '💧'
      };
    }

    // Optimal conditions
    const hoursNoRain = this.getHoursWithoutRain(forecast.hourly);
    return {
      canSprayNow: true,
      nextOptimalWindow: null,
      waitReason: null,
      recommendation: `✅ Spray now - no rain for next ${hoursNoRain} hours`,
      urgency: 'low',
      icon: '✅'
    };
  }

  private findNextClearWindow(hourlyForecast: WeatherData[]): { hours: number; window: Date | null } {
    for (let i = 1; i < hourlyForecast.length; i++) {
      const next6Hours = hourlyForecast.slice(i, i + 6);
      const hasRain = next6Hours.some(hour => hour.precipitation > 0.1);
      
      if (!hasRain) {
        return {
          hours: i,
          window: hourlyForecast[i].timestamp
        };
      }
    }
    
    return { hours: 24, window: null };
  }

  private findLowWindWindow(hourlyForecast: WeatherData[]): Date | null {
    const lowWindHour = hourlyForecast.find(hour => hour.wind_speed <= 10);
    return lowWindHour?.timestamp || null;
  }

  private findCoolerWindow(hourlyForecast: WeatherData[]): Date | null {
    const coolerHour = hourlyForecast.find(hour => hour.temperature <= 30);
    return coolerHour?.timestamp || null;
  }

  private getHoursWithoutRain(hourlyForecast: WeatherData[]): number {
    let hours = 0;
    for (const hour of hourlyForecast) {
      if (hour.precipitation > 0.1) break;
      hours++;
    }
    return hours;
  }

  analyzeWeatherImpact(disease: string, currentWeather: WeatherData): WeatherImpact {
    const { temperature, humidity, precipitation } = currentWeather;
    
    let currentRisk: 'low' | 'medium' | 'high' = 'low';
    let advice = '';

    // Disease-specific weather impact analysis
    if (disease.toLowerCase().includes('blight')) {
      currentRisk = humidity > 70 && temperature > 20 ? 'high' : humidity > 60 ? 'medium' : 'low';
      advice = 'Blight thrives in warm, humid conditions. Reduce humidity around plants and improve air circulation.';
    } else if (disease.toLowerCase().includes('rust')) {
      currentRisk = humidity > 80 ? 'high' : humidity > 60 ? 'medium' : 'low';
      advice = 'Rust diseases love high humidity. Avoid overhead watering and ensure good ventilation.';
    } else if (disease.toLowerCase().includes('spot')) {
      currentRisk = humidity > 75 && precipitation > 0 ? 'high' : humidity > 65 ? 'medium' : 'low';
      advice = 'Leaf spot diseases spread rapidly in wet conditions. Keep foliage dry and remove infected leaves.';
    } else {
      currentRisk = humidity > 70 ? 'medium' : 'low';
      advice = 'Monitor weather conditions and adjust watering practices accordingly.';
    }

    return {
      disease,
      currentRisk,
      factors: {
        humidity: {
          level: humidity,
          impact: humidity > 80 ? 'Very High Risk' : humidity > 70 ? 'High Risk' : humidity > 60 ? 'Medium Risk' : 'Low Risk'
        },
        temperature: {
          level: temperature,
          impact: temperature > 30 ? 'Heat Stress Risk' : temperature > 25 ? 'Optimal for Pathogens' : temperature > 15 ? 'Moderate Growth' : 'Slow Pathogen Growth'
        },
        precipitation: {
          level: precipitation,
          impact: precipitation > 5 ? 'High Infection Risk' : precipitation > 1 ? 'Moderate Risk' : 'Low Risk'
        }
      },
      advice
    };
  }

  getSeasonalCare(month: number): { tips: string[]; focus: string; diseases: string[] } {
    const seasonalData = {
      0: { // January
        tips: [
          'Prune diseased branches during dormant season',
          'Clean and disinfect garden tools',
          'Apply dormant oil sprays to fruit trees'
        ],
        focus: 'Prevention and Planning',
        diseases: ['Canker', 'Scale insects']
      },
      1: { // February
        tips: [
          'Start seedlings indoors with proper ventilation',
          'Check stored seeds for fungal issues',
          'Plan crop rotation to prevent soil-borne diseases'
        ],
        focus: 'Seed Starting',
        diseases: ['Damping-off', 'Seed rot']
      },
      2: { // March
        tips: [
          'Begin outdoor planting in warm climates',
          'Monitor for early pest emergence',
          'Apply pre-emergent fungicides if needed'
        ],
        focus: 'Early Season Preparation',
        diseases: ['Early blight', 'Downy mildew']
      },
      3: { // April
        tips: [
          'Increase watering frequency as temperatures rise',
          'Watch for aphid populations',
          'Apply mulch to retain moisture and prevent splash-up'
        ],
        focus: 'Active Growth Period',
        diseases: ['Aphid-borne viruses', 'Bacterial wilt']
      },
      4: { // May
        tips: [
          'Monitor humidity levels in greenhouse',
          'Begin regular disease prevention sprays',
          'Ensure proper plant spacing for air circulation'
        ],
        focus: 'Disease Prevention',
        diseases: ['Powdery mildew', 'Rust diseases']
      },
      5: { // June
        tips: [
          'Increase surveillance for disease symptoms',
          'Adjust watering to avoid overhead irrigation',
          'Remove lower leaves to improve air flow'
        ],
        focus: 'Active Monitoring',
        diseases: ['Late blight', 'Bacterial spot']
      },
      6: { // July
        tips: [
          'Peak disease pressure - apply treatments as needed',
          'Harvest frequently to prevent overripe fruit diseases',
          'Maintain consistent soil moisture'
        ],
        focus: 'Peak Season Management',
        diseases: ['Anthracnose', 'Botrytis']
      },
      7: { // August
        tips: [
          'Continue intensive disease management',
          'Avoid overhead watering during humid periods',
          'Harvest regularly and remove diseased fruit'
        ],
        focus: 'Heat Stress Management',
        diseases: ['Sunscald', 'Heat-related disorders']
      },
      8: { // September
        tips: [
          'Begin fall disease prevention',
          'Reduce nitrogen fertilization',
          'Plan for crop residue removal'
        ],
        focus: 'Transition Planning',
        diseases: ['Late season blights', 'Storage rots']
      },
      9: { // October
        tips: [
          'Harvest and cure crops properly',
          'Remove plant debris to reduce overwintering pests',
          'Apply fall fungicide treatments if needed'
        ],
        focus: 'Harvest and Cleanup',
        diseases: ['Storage diseases', 'Post-harvest rots']
      },
      10: { // November
        tips: [
          'Complete garden cleanup',
          'Apply winter protection treatments',
          'Store tools and equipment properly'
        ],
        focus: 'Winter Preparation',
        diseases: ['Winter injury', 'Canker diseases']
      },
      11: { // December
        tips: [
          'Plan next year\'s disease management strategy',
          'Review this year\'s disease occurrences',
          'Order seeds and treatments for next season'
        ],
        focus: 'Planning and Review',
        diseases: ['Planning phase - no active diseases']
      }
    };

    return seasonalData[month as keyof typeof seasonalData] || seasonalData[0];
  }

  async getUserLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error, using default location:', error);
          // Fallback to Manila, Philippines coordinates on any error
          resolve({ lat: 14.5995, lon: 120.9842 });
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 600000 // 10 minutes
        }
      );
    });
  }
}

export const weatherTreatmentService = new WeatherTreatmentService();
export type { WeatherData, ForecastData, TreatmentRecommendation, WeatherImpact };