import { useState, useEffect, useCallback } from "react";
import { Search, Filter, TrendingUp, Calendar, MapPin, CalendarIcon, X } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import NewsCard from "@/components/NewsCard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/contexts/TranslationContext";
import heroImage from "@/assets/hero-agriculture.jpg";
import farmerImage from "@/assets/farmer-mobile.jpg";
const Home = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [weather, setWeather] = useState({
    location: "Loading...",
    temperature: "--",
    condition: "⏳",
    description: "Getting location..."
  });
  const categories = ["All", "agriculture", "gemini", "market", "weather", "general"];
  useEffect(() => {
    fetchNews();
    fetchCarouselItems();
    getUserLocationAndWeather();

    // Add interval to refresh news data every 5 minutes to prevent stale cache
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!carouselApi) return;

    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const fetchCarouselItems = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_carousel')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCarouselItems(data || []);
    } catch (error) {
      console.error('Error fetching carousel items:', error);
    }
  };
  const getUserLocationAndWeather = async () => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setWeather({
          location: "Manila",
          temperature: "28",
          condition: "☀️",
          description: "Location not available"
        });
        return;
      }

      // Get user's current position
      navigator.geolocation.getCurrentPosition(async position => {
        const {
          latitude,
          longitude
        } = position.coords;
        await fetchWeatherData(latitude, longitude);
      }, error => {
        console.error('Geolocation error:', error);
        // Fallback to Manila coordinates
        fetchWeatherData(14.5995, 120.9842);
      }, {
        timeout: 10000,
        enableHighAccuracy: true
      });
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback weather data
      setWeather({
        location: "Manila",
        temperature: "28",
        condition: "☀️",
        description: "Perfect for farming"
      });
    }
  };
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'weather-forecast',
        {
          body: { lat, lon },
        }
      );

      if (error || !data) {
        throw error || new Error('Weather function returned no data');
      }

      const weatherData = data as {
        location: string;
        temperature: number;
        conditionEmoji: string;
        description: string;
      };

      setWeather({
        location: weatherData.location,
        temperature: Math.round(weatherData.temperature).toString(),
        condition: weatherData.conditionEmoji,
        description: weatherData.description,
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather({
        location: "Location unavailable",
        temperature: "--",
        condition: "⛅",
        description: "Weather unavailable",
      });
    }
  };
  const fetchNews = async () => {
    try {
      console.log('Fetching news with timestamp:', new Date().toISOString());

      // Add cache busting to ensure fresh data
      const {
        data,
        error
      } = await supabase.from('news').select('*').eq('published', true).order('created_at', {
        ascending: false
      });
      console.log('Raw data from database:', data?.length ? data.slice(0, 2) : 'No data');
      if (error) {
        console.error('Error fetching news:', error);
        // Fall back to static data
        setNewsData([{
          id: 1,
          title: "New Rice Varieties Show 30% Higher Yield in Luzon Trials",
          excerpt: "Scientists from the International Rice Research Institute have developed new climate-resistant rice varieties that demonstrate significant yield improvements across multiple provinces in Northern Luzon.",
          category: "Crops",
          author: "Dr. Maria Santos",
          publishedAt: "2024-01-15T10:30:00Z",
          readTime: "5 min read",
          views: 2840,
          image: heroImage,
          featured: true
        }, {
          id: 2,
          title: "Government Launches ₱2.5B Agricultural Modernization Program",
          excerpt: "The Department of Agriculture announces a comprehensive program to modernize farming equipment and provide digital tools to Filipino farmers across the archipelago.",
          category: "Government Programs",
          author: "Carlos Mendez",
          publishedAt: "2024-01-14T14:20:00Z",
          readTime: "3 min read",
          views: 1920,
          image: farmerImage
        }, {
          id: 3,
          title: "Corn Prices Surge 15% Amid Strong Export Demand",
          excerpt: "Local corn prices have increased significantly due to robust international demand and favorable weather conditions in major growing regions.",
          category: "Market Prices",
          author: "Jennifer Cruz",
          publishedAt: "2024-01-13T09:15:00Z",
          readTime: "4 min read",
          views: 1560
        }, {
          id: 4,
          title: "Drone Technology Revolutionizes Crop Monitoring in Mindanao",
          excerpt: "Farmers in Mindanao are adopting drone technology for precision agriculture, resulting in better crop monitoring and reduced pesticide usage.",
          category: "Technology",
          author: "Tech Reporter",
          publishedAt: "2024-01-12T16:45:00Z",
          readTime: "6 min read",
          views: 2100
        }, {
          id: 5,
          title: "Organic Livestock Farming Shows Promising Growth",
          excerpt: "The organic livestock sector in the Philippines is experiencing rapid growth as consumers increasingly demand sustainably-raised meat products.",
          category: "Livestock",
          author: "Ana Rodriguez",
          publishedAt: "2024-01-11T11:30:00Z",
          readTime: "4 min read",
          views: 980
        }]);
      } else {
        const mappedData = data.map(item => ({
          id: item.id,
          title: item.title,
          excerpt: item.content.substring(0, 150) + '...',
          category: item.category || 'Agriculture',
          author: 'DA Press Office',
          publishedAt: item.created_at,
          readTime: Math.ceil(item.content.split(' ').length / 200) + ' min read',
          views: item.views || 0,
          image: item.image_url && item.image_url.trim() !== '' ? item.image_url : heroImage,
          featured: false
        }));
        console.log('Mapped news data sample:', mappedData.slice(0, 2).map(item => ({
          id: item.id,
          title: item.title,
          image: item.image,
          hasImage: !!item.image,
          imageIsExternal: item.image?.startsWith('http')
        })));
        setNewsData(mappedData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredNews = newsData.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) || news.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || news.category?.toLowerCase() === selectedCategory.toLowerCase();

    // Date filtering logic
    let matchesDate = true;
    if (selectedDate) {
      const newsDate = new Date(news.publishedAt);
      const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const newsDateOnly = new Date(newsDate.getFullYear(), newsDate.getMonth(), newsDate.getDate());
      matchesDate = newsDateOnly.getTime() === selectedDateOnly.getTime();
    } else if (dateRange?.from || dateRange?.to) {
      const newsDate = new Date(news.publishedAt);
      if (dateRange.from && dateRange.to) {
        matchesDate = newsDate >= dateRange.from && newsDate <= dateRange.to;
      } else if (dateRange.from) {
        matchesDate = newsDate >= dateRange.from;
      } else if (dateRange.to) {
        matchesDate = newsDate <= dateRange.to;
      }
    }
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedDate, dateRange]);
  const trendingTopics = ["Rice Production", "Climate Change", "Organic Farming", "Export Markets", "Government Subsidies"];
  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setDateRange(undefined);
  };
  return <div className="min-h-screen bg-background pb-20">
      {/* Mobile Hero Carousel Section */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <Carousel
          opts={{
            loop: true,
            align: "start",
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: false,
            }),
          ]}
          setApi={setCarouselApi}
          className="w-full h-full"
        >
          <CarouselContent className="h-48 sm:h-56 md:h-64">
            {carouselItems.length > 0 ? (
              carouselItems.map((item) => (
                <CarouselItem key={item.id} className="h-48 sm:h-56 md:h-64">
                  <div className="relative h-full w-full">
                    <img 
                      src={item.image_url} 
                      alt={item.title || "Promotional"} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                      <div className="text-center text-white px-6 max-w-md">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 leading-tight [text-shadow:_0_2px_8px_rgba(0,0,0,0.8),_0_1px_3px_rgba(0,0,0,0.9)]">
                          {item.title || "Welcome To Gemini"}
                        </h1>
                        <p className="text-xs sm:text-sm text-white leading-relaxed [text-shadow:_0_2px_6px_rgba(0,0,0,0.7),_0_1px_2px_rgba(0,0,0,0.8)]">
                          {item.subtitle || "Latest news and insights for Filipino farmers"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="h-48 sm:h-56 md:h-64">
                <div className="relative h-full w-full">
                  <img src={heroImage} alt="Philippine Agriculture" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-6 max-w-md">
                      <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 leading-tight [text-shadow:_0_2px_8px_rgba(0,0,0,0.8),_0_1px_3px_rgba(0,0,0,0.9)]">
                        Welcome To Gemini
                      </h1>
                      <p className="text-xs sm:text-sm text-white leading-relaxed [text-shadow:_0_2px_6px_rgba(0,0,0,0.7),_0_1px_2px_rgba(0,0,0,0.8)]">
                        Latest news and insights for Filipino farmers
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
        {/* Carousel Dot Indicators */}
        {slideCount > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2.5 z-20 bg-black/30 px-3 py-2 rounded-full">
            {Array.from({ length: slideCount }).map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300 shadow-md",
                  currentSlide === index
                    ? "bg-white w-6 shadow-lg"
                    : "bg-white/60 hover:bg-white/90"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4 bg-background">
        {/* Mobile Search and Filter - Compact */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('search_news')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-10 placeholder:text-xs" />
          </div>

          {/* Category Filter - Horizontal Scroll */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(category => <Badge key={category} variant={selectedCategory === category ? "default" : "outline"} className="cursor-pointer transition-smooth hover:scale-105 whitespace-nowrap text-xs px-3 py-1 min-h-[28px] touch-manipulation" onClick={() => setSelectedCategory(category)}>
                {category}
              </Badge>)}
          </div>
        </div>

        {/* Weather Widget - Above Latest News */}
        <Card className="bg-primary/5 mb-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Today's Weather</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {weather.location} {weather.temperature}°C {weather.condition}
                </div>
                <div className="text-xs text-muted-foreground">{weather.description}</div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Mobile News Grid - Single Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">{t('latest_news')}</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowDateFilters(!showDateFilters)} className="flex items-center gap-1 h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
              <CalendarIcon className="w-3 h-3" />
              Choose Your Date
            </Button>
          </div>

          {/* Date Filter - Conditionally shown */}
          {showDateFilters && <div className="flex flex-wrap gap-2 mb-4">
            {/* Single Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-9 text-xs px-3 flex-1 min-w-[140px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-9 text-xs px-3 flex-1 min-w-[140px] justify-center text-center font-normal", !dateRange?.from && !dateRange?.to && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {dateRange?.from && dateRange.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : dateRange?.from ? `From ${format(dateRange.from, "MMM dd")}` : dateRange?.to ? `Until ${format(dateRange.to, "MMM dd")}` : "Date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="range" selected={dateRange} onSelect={range => setDateRange(range)} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            {/* Clear Date Filter Button */}
            {(selectedDate || dateRange?.from || dateRange?.to) && <Button variant="ghost" size="sm" onClick={clearDateFilter} className="h-9 px-2 text-xs">
                <X className="h-3 w-3" />
              </Button>}
          </div>}

          <div className="space-y-3">
            {loading ? <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading news...</p>
              </div> : filteredNews.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground">No news found.</p>
              </div> : <>
                {currentNews.map((news, index) => <NewsCard id={news.id} key={news.id} title={news.title} excerpt={news.excerpt} category={news.category} author={news.author} publishedAt={news.publishedAt} readTime={news.readTime} views={news.views} image={news.image} featured={index === 0 && currentPage === 1} />)}
                
                {/* Pagination */}
                {totalPages > 1 && <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={e => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
                        </PaginationItem>
                        
                        {Array.from({
                    length: totalPages
                  }, (_, i) => i + 1).map(page => <PaginationItem key={page}>
                            <PaginationLink href="#" onClick={e => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }} isActive={currentPage === page}>
                              {page}
                            </PaginationLink>
                          </PaginationItem>)}
                        
                        <PaginationItem>
                          <PaginationNext href="#" onClick={e => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>}
              </>}
          </div>
        </div>
      </div>
    </div>;
};
export default Home;