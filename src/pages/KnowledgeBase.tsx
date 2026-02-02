import { useState } from "react";
import { ArrowLeft, Search, BookOpen, Leaf, Droplets, FlaskConical, Sprout, ChevronRight, Star, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { KnowledgeArticleSheet } from "@/components/KnowledgeArticleSheet";

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
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const categories: Category[] = [
    { id: "all", name: "All Products", icon: BookOpen, count: 7, color: "bg-blue-100 text-blue-700" },
    { id: "herofol-denso", name: "Herofol Denso", icon: Droplets, count: 4, color: "bg-green-100 text-green-700" },
    { id: "bioestimulantes", name: "Biostimulants", icon: Sprout, count: 2, color: "bg-purple-100 text-purple-700" },
    { id: "correctores", name: "Correctors", icon: FlaskConical, count: 1, color: "bg-orange-100 text-orange-700" }
  ];

  const articles: Article[] = [
    {
      id: "1",
      title: "Herofol Denso Equilibrado - Balanced NPK Foliar Fertilizer",
      excerpt: "A high-concentration NPK foliar fertilizer with chelated micronutrients, enriched with XR47 activator to boost photosynthesis. Recommended for growth, flowering, and fruiting stages.",
      category: "herofol-denso",
      readTime: "5 min read",
      views: 1850,
      rating: 4.9,
      author: "Herogra Especiales",
      date: "Dec 10, 2024"
    },
    {
      id: "2",
      title: "Herofol Denso Green - Vegetative Growth Enhancer",
      excerpt: "NPK gel fertilizer with high nitrogen content and chelated micronutrients. Features unique absorption promoters and XR47 activator for enhanced photosynthesis. Patented technology present in 56+ countries.",
      category: "herofol-denso",
      readTime: "6 min read",
      views: 1620,
      rating: 4.8,
      author: "Herogra Especiales",
      date: "Dec 8, 2024"
    },
    {
      id: "3",
      title: "Herofol Denso Amino-K (ECO) - Organic Potassium Solution",
      excerpt: "High-concentration potassium fertilizer with natural plant amino acids. Promotes sugar translocation from photosynthetic organs to fruits. Certified for Organic Agriculture (CAAE).",
      category: "herofol-denso",
      readTime: "5 min read",
      views: 1480,
      rating: 4.7,
      author: "Herogra Especiales",
      date: "Dec 5, 2024"
    },
    {
      id: "4",
      title: "Herofol Denso Ca-Mg - Calcium & Magnesium Corrector",
      excerpt: "Advanced foliar fertilizer suspension with specific adjuvants for optimal nutrient absorption. High in nitrogen, calcium, and magnesium complexes with chelated micronutrients and XR47 activator.",
      category: "correctores",
      readTime: "4 min read",
      views: 1340,
      rating: 4.8,
      author: "Herogra Especiales",
      date: "Dec 3, 2024"
    },
    {
      id: "5",
      title: "Totem (ECO) - Next-Generation Root Biostimulant",
      excerpt: "Latest generation biostimulant using Orygin 2.0 technology with Bacillus Velezensis HE05. Promotes root development, regenerates root systems, and extends crop life cycle. CAAE certified organic.",
      category: "bioestimulantes",
      readTime: "7 min read",
      views: 2150,
      rating: 4.9,
      author: "Herogra Especiales",
      date: "Dec 1, 2024"
    },
    {
      id: "6",
      title: "Heromar (ECO) - Seaweed-Based Biostimulant",
      excerpt: "Powerful biostimulant from Ascophyllum nodosum seaweed. Enhances root and vegetative development, fruit quality, and stress tolerance. Rich in polysaccharides, amino acids, and antioxidants.",
      category: "bioestimulantes",
      readTime: "6 min read",
      views: 1890,
      rating: 4.8,
      author: "Herogra Especiales",
      date: "Nov 28, 2024"
    },
    {
      id: "7",
      title: "Aminofulvat (ECO) - Soil Improver & Biostimulant",
      excerpt: "NK fertilizer with high biostimulant capacity containing fulvic acids, amino acids, sugars, and betaines. Improves soil structure, releases blocked nutrients, and enhances biological activity. CAAE certified.",
      category: "bioestimulantes",
      readTime: "5 min read",
      views: 1560,
      rating: 4.7,
      author: "Herogra Especiales",
      date: "Nov 25, 2024"
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedArticle(null);
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
              <h1 className="text-lg font-bold text-foreground">Foliar Fertilizers</h1>
              <p className="text-xs text-muted-foreground">Herogra Especiales Products</p>
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>

        {/* Mobile-Optimized Categories */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground px-1">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
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
                      <p className="text-xs text-muted-foreground">{category.count} products</p>
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
              <Leaf className="w-3 h-3 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Herogra Especiales</h3>
              <p className="text-xs text-white/80">100+ years of agricultural expertise</p>
            </div>
          </div>
        </div>

        {/* Mobile Articles Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold">
              {selectedCategory === "all" ? "All Products" : 
               categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p className="text-xs text-muted-foreground">{filteredArticles.length} articles</p>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-card rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer active:scale-98"
                  onClick={() => handleArticleClick(article)}
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
              <h3 className="text-base font-semibold mb-2">No products found</h3>
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

      <KnowledgeArticleSheet 
        article={selectedArticle} 
        open={sheetOpen} 
        onClose={handleSheetClose} 
      />
    </div>
  );
};

export default KnowledgeBase;
