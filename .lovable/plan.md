

# Home Page UI Redesign - Weather Widget Enhancement

## Overview
Redesign the Home page to replace the sliding promotional carousel with a new enhanced hero section inspired by the reference image. The new design features a personalized greeting with the user's name, current date, search bar, and an expanded weather widget with detailed meteorological data including humidity, precipitation, pressure, wind speed, and sunrise/sunset times.

## What You'll Get
- A clean, modern hero section with personalized greeting ("Hello, Good Morning/Afternoon/Evening")
- User's avatar displayed in the greeting area
- Current date displayed prominently
- Enhanced weather widget showing:
  - Location name
  - Large temperature display with High/Low
  - Weather condition icon
  - Humidity, Precipitation, Pressure, Wind Speed
  - Sunrise and Sunset times
- Admin toggle to re-enable the carousel in the future

---

## Changes Summary

### 1. Enhanced Weather API (Edge Function)
Update the weather-forecast edge function to return additional data:
- High/Low temperatures for the day
- Humidity percentage
- Precipitation amount
- Surface pressure
- Wind speed
- Sunrise and Sunset times

### 2. Home Page Redesign
Replace the carousel section with:

**Greeting Section (Green Header)**
- "Hello, Good Morning/Afternoon/Evening" with dynamic time-based greeting
- Current date (e.g., "Sunday, 02 Feb 2026")
- User's avatar (or default if not logged in)
- Search bar with rounded corners

**Enhanced Weather Widget Card**
- Location pin with location name
- Large temperature display (+27°C format)
- High/Low temperatures (H: 32°C / L: 24°C)
- Weather condition icon (cloud, sun, moon composite)
- Grid of weather details:
  - Humidity with percentage
  - Precipitation with amount (mm)
  - Pressure in hPa
  - Wind speed in m/s
- Sunrise and Sunset times with visual indicator

### 3. Admin Carousel Toggle
Add a toggle switch in the Admin Carousel Tab to enable/disable the carousel display on the home page. This will store the setting in the `app_settings` table.

---

## Technical Details

### Database Changes
Add a new column to `app_settings` table:
```sql
ALTER TABLE app_settings 
ADD COLUMN show_carousel BOOLEAN DEFAULT true;
```

### Edge Function Update (weather-forecast/index.ts)
Expand the Open-Meteo API call to include:
- `daily=temperature_2m_max,temperature_2m_min,sunrise,sunset`
- `hourly=relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m`

Return structure:
```typescript
{
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
```

### Home.tsx Component Changes
- Import `useAuth` to get user profile data for avatar
- Fetch user profile from `profiles` table for first_name and avatar_url
- Create `getTimeBasedGreeting()` function returning "Good Morning/Afternoon/Evening"
- Update weather state to include all new fields
- Replace carousel section with:
  - Green gradient header (`bg-primary` or similar)
  - Greeting text with user's first name
  - Date display using date-fns format
  - User avatar with Avatar component
  - Styled search input
- Create new Weather Widget Card component with:
  - Location with MapPin icon
  - Temperature display with high/low
  - Weather icon (using emoji or custom SVG)
  - 4-column grid for humidity, precipitation, pressure, wind
  - Sunrise/Sunset row with times

### AdminCarouselTab.tsx Changes
Add a toggle at the top of the component:
- "Show Carousel on Home Page" switch
- Fetch current setting on mount
- Update `app_settings` table when toggled

### Files to Modify
1. `supabase/functions/weather-forecast/index.ts` - Expand API call and response
2. `src/pages/Home.tsx` - Complete hero section redesign
3. `src/components/admin/AdminCarouselTab.tsx` - Add carousel visibility toggle
4. Database migration - Add `show_carousel` column

### New State Variables in Home.tsx
```typescript
const [weather, setWeather] = useState({
  location: "Loading...",
  temperature: "--",
  temperatureHigh: "--",
  temperatureLow: "--",
  humidity: "--",
  precipitation: "--",
  pressure: "--",
  windSpeed: "--",
  sunrise: "--:--",
  sunset: "--:--",
  condition: "⏳",
  description: "Getting location..."
});
const [showCarousel, setShowCarousel] = useState(false);
const [userProfile, setUserProfile] = useState<{
  first_name?: string;
  avatar_url?: string;
} | null>(null);
```

### Visual Design Notes
- Header background: Primary green color with subtle gradient
- White text on green header
- Weather card: White/card background with rounded corners and shadow
- Temperature: Large bold text (~text-4xl)
- Weather details grid: 4 equal columns
- Sunrise/Sunset: Horizontal layout with visual sun arc indicator

