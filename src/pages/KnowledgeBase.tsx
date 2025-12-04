import { useState } from "react";
import { ArrowLeft, Search, BookOpen, Users, Sprout, Bug, Droplets, Sun, ChevronRight, Star, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  views: number;
  rating: number;
  author: string;
  date: string;
}

interface Category {
  id: string;
  name: string;
  icon: any;
  count: number;
  color: string;
}

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories: Category[] = [
    { id: "all", name: "All Topics", icon: BookOpen, count: 24, color: "bg-blue-100 text-blue-700" },
    { id: "planting", name: "Planting", icon: Sprout, count: 8, color: "bg-green-100 text-green-700" },
    { id: "pest-control", name: "Pest Control", icon: Bug, count: 6, color: "bg-red-100 text-red-700" },
    { id: "irrigation", name: "Irrigation", icon: Droplets, count: 5, color: "bg-cyan-100 text-cyan-700" },
    { id: "weather", name: "Weather", icon: Sun, count: 3, color: "bg-yellow-100 text-yellow-700" },
    { id: "community", name: "Community", icon: Users, count: 2, color: "bg-purple-100 text-purple-700" }
  ];

  const articles: Article[] = [
    {
      id: "1",
      title: "Complete Guide to Rice Planting in the Philippines",
      excerpt: "Learn the best practices for rice cultivation including soil preparation, seed selection, and optimal planting times.",
      category: "planting",
      readTime: "8 min read",
      views: 1250,
      rating: 4.8,
      author: "Dr. Maria Santos",
      date: "Jan 15, 2024"
    },
    {
      id: "2",
      title: "Natural Pest Control Methods for Organic Farming",
      excerpt: "Discover eco-friendly ways to protect your crops from pests without harmful chemicals.",
      category: "pest-control",
      readTime: "6 min read",
      views: 980,
      rating: 4.7,
      author: "Juan Dela Cruz",
      date: "Jan 12, 2024"
    },
    {
      id: "3",
      title: "Water-Efficient Irrigation Techniques",
      excerpt: "Maximize crop yield while conserving water with these proven irrigation methods.",
      category: "irrigation",
      readTime: "5 min read",
      views: 756,
      rating: 4.6,
      author: "Ana Reyes",
      date: "Jan 10, 2024"
    },
    {
      id: "4",
      title: "Understanding Seasonal Weather Patterns",
      excerpt: "Plan your farming activities around weather patterns for better crop success.",
      category: "weather",
      readTime: "7 min read",
      views: 643,
      rating: 4.5,
      author: "Carlos Miguel",
      date: "Jan 8, 2024"
    },
    {
      id: "5",
      title: "Building Strong Farming Communities",
      excerpt: "How to connect with other farmers and share knowledge for mutual growth.",
      category: "community",
      readTime: "4 min read",
      views: 425,
      rating: 4.9,
      author: "Rosa Martinez",
      date: "Jan 5, 2024"
    },
    {
      id: "6",
      title: "Soil Health and Nutrient Management",
      excerpt: "Essential tips for maintaining healthy soil and proper nutrient balance.",
      category: "planting",
      readTime: "9 min read",
      views: 892,
      rating: 4.7,
      author: "Dr. Roberto Lopez",
      date: "Jan 3, 2024"
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleArticleClick = (articleId: string) => {
    // For now, just show a toast. In a real app, this would navigate to the article detail page
    console.log(`Navigate to article: ${articleId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Mobile Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/forum')}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-foreground">Knowledge Base</h1>
              <p className="text-xs text-muted-foreground">Expert farming guides</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {filteredArticles.length}
          </Badge>
        </div>
      </div>

      <div className="px-3 pt-3 space-y-3">
        {/* Compact Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>

        {/* Mobile-Optimized Categories */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground px-1">Categories</h3>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedCategory === category.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium leading-tight">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.count}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Featured Banner - Solid Green Background */}
        <div className="bg-primary rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Featured Articles</h3>
              <p className="text-xs text-white/80">Most popular</p>
            </div>
          </div>
        </div>

        {/* Mobile Articles Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">
              {selectedCategory === "all" ? "All Articles" : 
               categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p className="text-xs text-muted-foreground">{filteredArticles.length}</p>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-card rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer active:scale-98"
                  onClick={() => handleArticleClick(article.id)}
                >
                  <div className="w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          {categories.find(c => c.id === article.category)?.name}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">{article.rating}</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{article.readTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{article.views}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <p className="text-xs text-muted-foreground truncate">
                          {article.author} • {article.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-6 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-2">No articles found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try different search terms or browse other categories.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;