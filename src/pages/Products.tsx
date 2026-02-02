import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Star, Package, Leaf, HelpCircle, X, SlidersHorizontal, TrendingUp, DollarSign, Phone, Building2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import productsImage from "@/assets/products-showcase.jpg";
const Products = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState("relevance");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const categories = ["All", "seeds", "tools", "fertilizers", "equipment", "services"];

  // Enhanced search terms for suggestions
  const commonSearchTerms = ["foliar fertilizer", "organic", "bio-pesticide", "root stimulator", "soil enhancer", "growth promoter", "liquid fertilizer", "NPK", "micronutrients", "pest control", "crop nutrition", "yield booster"];

  const contacts = [
    { name: "Relan Rivas", phone: "0999 885 2599", region: "Region IV-A" },
    { name: "Preach Tibayan", phone: "0998 985 3740", region: "Region IV-A" },
    { name: "Conrado Vasquez", phone: "0998 954 5137", region: "Region V" },
  ];

  const handleCallTechnician = (phoneNumber: string, name: string) => {
    window.location.href = `tel:${phoneNumber}`;
    toast({
      title: "Calling...",
      description: `Initiating call to ${name}`,
    });
  };
  useEffect(() => {
    fetchProducts();
  }, []);
  const fetchProducts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('active', true).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching products:', error);
        // Fall back to static data
        setProducts([{
          id: 1,
          name: "GrowMax Premium Foliar Fertilizer",
          description: "Advanced micronutrient blend designed specifically for rice and corn crops. Enhances photosynthesis and improves yield quality.",
          price: "₱850.00",
          image: productsImage,
          rating: 4.8,
          reviews: 245,
          benefits: ["Increased Yield", "Disease Resistance", "Fast Absorption", "Organic Certified"],
          inStock: true,
          featured: true,
          category: "Foliar Fertilizers"
        }, {
          id: 2,
          name: "CropBoost Liquid Fertilizer",
          description: "Liquid concentrate with essential NPK nutrients and trace elements for optimal plant growth and development.",
          price: "₱720.00",
          image: productsImage,
          rating: 4.6,
          reviews: 189,
          benefits: ["Quick Release", "Water Soluble", "Root Development"],
          inStock: true,
          featured: false,
          category: "Foliar Fertilizers"
        }, {
          id: 3,
          name: "EcoGrow Organic Soil Enhancer",
          description: "100% organic soil conditioner that improves soil structure, water retention, and microbial activity.",
          price: "₱650.00",
          image: productsImage,
          rating: 4.7,
          reviews: 156,
          benefits: ["Organic Certified", "Soil Health", "pH Balance"],
          inStock: true,
          featured: false,
          category: "Soil Enhancers"
        }, {
          id: 4,
          name: "PlantGuard Bio-Pesticide",
          description: "Natural pest control solution that protects crops while maintaining environmental safety standards.",
          price: "₱980.00",
          image: productsImage,
          rating: 4.5,
          reviews: 98,
          benefits: ["Bio-Safe", "Targeted Control", "Residue-Free"],
          inStock: false,
          featured: false,
          category: "Pest Control"
        }, {
          id: 5,
          name: "VitalGrow Root Stimulator",
          description: "Specialized formula that promotes healthy root development and increases nutrient uptake efficiency.",
          price: "₱780.00",
          image: productsImage,
          rating: 4.9,
          reviews: 312,
          benefits: ["Root Growth", "Nutrient Uptake", "Stress Tolerance"],
          inStock: true,
          featured: false,
          category: "Growth Promoters"
        }, {
          id: 6,
          name: "HarvestMax Complete Nutrition",
          description: "All-in-one nutritional solution providing complete macro and micronutrients for all crop stages.",
          price: "₱1,200.00",
          image: productsImage,
          rating: 4.8,
          reviews: 203,
          benefits: ["Complete Nutrition", "All Stages", "Premium Quality"],
          inStock: true,
          featured: true,
          category: "Foliar Fertilizers"
        }]);
      } else {
        setProducts(data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: `₱${item.price?.toFixed(2) || '0.00'}`,
          image: item.image_url || productsImage,
          rating: 4.5 + Math.random() * 0.4,
          reviews: Math.floor(Math.random() * 300) + 50,
          benefits: [],
          inStock: item.stock_quantity > 0,
          featured: false,
          category: item.category || 'General',
          stockQuantity: item.stock_quantity || 0,
          lowStockThreshold: item.low_stock_threshold || 5
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple and reliable search suggestions
  const generateSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const queryLower = query.toLowerCase();

    // Get suggestions from common terms
    const suggestions = commonSearchTerms.filter(term => term.toLowerCase().includes(queryLower)).slice(0, 5);

    // Add product-based suggestions
    const productSuggestions = products.filter(p => p.name?.toLowerCase().includes(queryLower)).map(p => p.name).slice(0, 3);
    setSearchSuggestions([...suggestions, ...productSuggestions]);
  }, [products]);

  // Enhanced filtering and sorting
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Enhanced search with simpler, more reliable logic
      let matchesSearch = true;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const name = product.name?.toLowerCase() || '';
        const description = product.description?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';

        // Check if query matches name, description, or category
        const nameMatch = name.includes(query);
        const descMatch = description.includes(query);
        const categoryMatch = category.includes(query);

        // Check benefits if they exist
        let benefitsMatch = false;
        if (product.benefits && Array.isArray(product.benefits)) {
          benefitsMatch = product.benefits.some((benefit: string) => benefit.toLowerCase().includes(query));
        }

        // Split query into words for partial matching
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);
        const wordMatches = queryWords.some(word => name.includes(word) || description.includes(word) || category.includes(word) || product.benefits && Array.isArray(product.benefits) && product.benefits.some((benefit: string) => benefit.toLowerCase().includes(word)));
        matchesSearch = nameMatch || descMatch || categoryMatch || benefitsMatch || wordMatches;
      }

      // Price filter with better error handling
      let matchesPrice = true;
      try {
        const priceStr = product.price?.toString() || '0';
        const price = parseFloat(priceStr.replace(/[₱,\s]/g, ''));
        matchesPrice = !isNaN(price) && price >= priceRange[0] && price <= priceRange[1];
      } catch (error) {
        console.warn('Price parsing error for product:', product.name, product.price);
        matchesPrice = true; // Don't exclude products with price parsing issues
      }

      // Category filter
      const matchesCategory = selectedCategory === "All" || product.category?.toLowerCase() === selectedCategory.toLowerCase();

      // Stock filter
      const matchesStock = !showInStockOnly || product.inStock;
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    // Sort products with better error handling
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          try {
            const priceA = parseFloat((a.price?.toString() || '0').replace(/[₱,\s]/g, ''));
            const priceB = parseFloat((b.price?.toString() || '0').replace(/[₱,\s]/g, ''));
            return (isNaN(priceA) ? 0 : priceA) - (isNaN(priceB) ? 0 : priceB);
          } catch {
            return 0;
          }
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          try {
            const priceA = parseFloat((a.price?.toString() || '0').replace(/[₱,\s]/g, ''));
            const priceB = parseFloat((b.price?.toString() || '0').replace(/[₱,\s]/g, ''));
            return (isNaN(priceB) ? 0 : priceB) - (isNaN(priceA) ? 0 : priceA);
          } catch {
            return 0;
          }
        });
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "reviews":
        filtered.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case "relevance":
      default:
        // For relevance, prioritize exact matches in name, then description
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered.sort((a, b) => {
            const aName = a.name?.toLowerCase() || '';
            const bName = b.name?.toLowerCase() || '';
            const aDesc = a.description?.toLowerCase() || '';
            const bDesc = b.description?.toLowerCase() || '';

            // Exact name matches first
            if (aName.includes(query) && !bName.includes(query)) return -1;
            if (!aName.includes(query) && bName.includes(query)) return 1;

            // Then description matches
            if (aDesc.includes(query) && !bDesc.includes(query)) return -1;
            if (!aDesc.includes(query) && bDesc.includes(query)) return 1;
            return 0;
          });
        }
        break;
    }
    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, sortBy, showInStockOnly]);

  // Handle search input with suggestions
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    generateSuggestions(value);
    setShowSuggestions(value.length > 0);
  };
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };
  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  // Get price range from products
  const priceRangeFromProducts = useMemo(() => {
    if (products.length === 0) return [0, 2000];
    try {
      const prices = products.map(p => {
        const priceStr = p.price?.toString() || '0';
        const price = parseFloat(priceStr.replace(/[₱,\s]/g, ''));
        return isNaN(price) ? 0 : price;
      }).filter(price => price > 0);
      if (prices.length === 0) return [0, 2000];
      return [Math.min(...prices), Math.max(...prices)];
    } catch (error) {
      console.warn('Error calculating price range:', error);
      return [0, 2000];
    }
  }, [products]);
  return <div className="min-h-screen bg-background pb-20">
      {/* Mobile Hero Section - Dark Overlay Style */}
      <div className="relative h-48 overflow-hidden">
        <img src="/lovable-uploads/c67eb1e5-a20e-4dcc-8d00-014ce98ea05b.png" alt="Agricultural Equipment" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-xl font-bold mb-2">
              Our Products
            </h1>
            <p className="text-xs text-white/90">
              Premium agricultural solutions for Filipino farmers
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 bg-background">
        {/* Enhanced Search and Filter */}
        <div className="mb-5 space-y-4">
          {/* Search with suggestions */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products (e.g., fertilizer, organic, pest control)..." value={searchQuery} onChange={e => handleSearchChange(e.target.value)} onFocus={() => generateSuggestions(searchQuery)} className="pl-10 pr-10 h-10 placeholder:text-xs" />
            {searchQuery && <Button variant="ghost" size="sm" onClick={clearSearch} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>}
            
            {/* Search suggestions dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && <Card className="absolute top-full left-0 right-0 z-10 mt-1 shadow-elevated">
                <CardContent className="p-2">
                  {searchSuggestions.map((suggestion, index) => <button key={index} className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors" onClick={() => handleSuggestionClick(suggestion)}>
                      {suggestion}
                    </button>)}
                </CardContent>
              </Card>}
          </div>

          {/* Quick filters and sort */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Filters
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filters - collapsible */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* Price range filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Price Range: ₱{priceRange[0]} - ₱{priceRange[1]}
                    </label>
                    <Slider value={priceRange} onValueChange={setPriceRange} max={priceRangeFromProducts[1]} min={priceRangeFromProducts[0]} step={50} className="w-full" />
                  </div>
                  
                  {/* Stock filter */}
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="inStock" checked={showInStockOnly} onChange={e => setShowInStockOnly(e.target.checked)} className="rounded" />
                    <label htmlFor="inStock" className="text-sm">In stock only</label>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Category Filter - Horizontal Scroll */}
          <div className="flex space-x-2.5 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => <Badge key={category} variant={selectedCategory === category ? "default" : "outline"} className="cursor-pointer transition-smooth hover:scale-105 whitespace-nowrap text-xs px-4 py-1.5 min-h-[32px] touch-manipulation" onClick={() => setSelectedCategory(category)}>
                {category}
              </Badge>)}
          </div>
        </div>

        {/* Registered Dealers Card */}
        <Card 
          className="mb-5 bg-primary border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dealers')}
        >
          <CardContent className="p-5">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-0.5">Registered Dealers</h3>
                <p className="text-xs text-white/80">Find authorized dealers near you</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Products Grid - 2 Columns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">
              Products ({filteredProducts.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading ? <div className="col-span-2 text-center py-10">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-3">Loading products...</p>
              </div> : filteredProducts.length === 0 ? <div className="col-span-2 text-center py-10 space-y-3">
                <Package className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground font-medium">No products found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try different keywords or adjust filters" : "Check back later for new products"}
                </p>
                {searchQuery && <Button variant="outline" size="sm" onClick={clearSearch} className="mt-3">
                    Clear search
                  </Button>}
              </div> : filteredProducts.map(product => <ProductCard key={product.id} id={product.id} name={product.name} description={product.description} price={product.price} image={product.image} rating={product.rating} reviews={product.reviews} benefits={product.benefits} inStock={product.inStock} featured={product.featured} stockQuantity={product.stockQuantity} lowStockThreshold={product.lowStockThreshold} />)}
          </div>
        </div>
        {/* Mobile Quick Support Card */}
        <Card className="mt-8">
          <CardContent className="p-5">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Need Help?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our experts are here to help you choose the right products.
                </p>
              </div>
              <Button size="sm" className="text-xs px-4" onClick={() => setShowContactModal(true)}>
                Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Modal - Native drawer on mobile, dialog on desktop */}
      {isMobile ? (
        <Drawer open={showContactModal} onOpenChange={setShowContactModal}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-center text-base font-semibold">
                Field Technicians Directory
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="px-4 pb-6 space-y-3 overflow-y-auto">
              <p className="text-center text-xs text-muted-foreground mb-4">
                Choose a field technician from your region to call directly.
              </p>
              
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <Card key={index} className="transition-all duration-200 active:scale-[0.98]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">📞</span>
                            <h3 className="text-sm font-semibold">{contact.name}</h3>
                          </div>
                          <p className="text-sm font-medium">{contact.phone}</p>
                          <p className="text-xs text-muted-foreground">{contact.region}</p>
                        </div>
                        <Button
                          size="sm"
                          className="ml-3"
                          onClick={() => handleCallTechnician(contact.phone.replace(/\s/g, ''), contact.name)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-center text-lg font-semibold">
                Field Technicians Directory
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Choose a field technician from your region to call directly.
              </p>
              
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <Card key={index} className="transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">📞</span>
                            <h3 className="text-sm font-semibold">{contact.name}</h3>
                          </div>
                          <p className="text-sm font-medium">{contact.phone}</p>
                          <p className="text-xs text-muted-foreground">{contact.region}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCallTechnician(contact.phone.replace(/\s/g, ''), contact.name)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>;
};
export default Products;