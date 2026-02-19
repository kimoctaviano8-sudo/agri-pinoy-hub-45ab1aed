import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, X, SlidersHorizontal, Phone, Building2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const categories = ["All", "seeds", "tools", "fertilizers", "equipment", "services"];
  const commonSearchTerms = ["foliar fertilizer", "organic", "bio-pesticide", "root stimulator", "soil enhancer", "growth promoter", "liquid fertilizer", "NPK", "micronutrients", "pest control", "crop nutrition", "yield booster"];
  const contacts = [{
    name: "Relan Rivas",
    phone: "0999 885 2599",
    region: "Region IV-A"
  }, {
    name: "Preach Tibayan",
    phone: "0998 985 3740",
    region: "Region IV-A"
  }, {
    name: "Conrado Vasquez",
    phone: "0998 954 5137",
    region: "Region V"
  }];
  const handleCallTechnician = (phoneNumber: string, name: string) => {
    window.location.href = `tel:${phoneNumber}`;
    toast({
      title: "Calling...",
      description: `Initiating call to ${name}`
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
        setProducts([{
          id: 1,
          name: "GrowMax Premium Foliar Fertilizer",
          description: "Advanced micronutrient blend designed specifically for rice and corn crops.",
          price: "₱850.00",
          image: productsImage,
          rating: 4.8,
          reviews: 245,
          benefits: ["Increased Yield", "Disease Resistance", "Fast Absorption"],
          inStock: true,
          featured: true,
          category: "Foliar Fertilizers"
        }, {
          id: 2,
          name: "CropBoost Liquid Fertilizer",
          description: "Liquid concentrate with essential NPK nutrients and trace elements.",
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
          description: "100% organic soil conditioner that improves soil structure.",
          price: "₱650.00",
          image: productsImage,
          rating: 4.7,
          reviews: 156,
          benefits: ["Organic Certified", "Soil Health", "pH Balance"],
          inStock: true,
          featured: false,
          category: "Soil Enhancers"
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
  const generateSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const queryLower = query.toLowerCase();
    const suggestions = commonSearchTerms.filter(term => term.toLowerCase().includes(queryLower)).slice(0, 5);
    const productSuggestions = products.filter(p => p.name?.toLowerCase().includes(queryLower)).map(p => p.name).slice(0, 3);
    setSearchSuggestions([...suggestions, ...productSuggestions]);
  }, [products]);
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      let matchesSearch = true;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const name = product.name?.toLowerCase() || '';
        const description = product.description?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';
        const nameMatch = name.includes(query);
        const descMatch = description.includes(query);
        const categoryMatch = category.includes(query);
        let benefitsMatch = false;
        if (product.benefits && Array.isArray(product.benefits)) {
          benefitsMatch = product.benefits.some((benefit: string) => benefit.toLowerCase().includes(query));
        }
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);
        const wordMatches = queryWords.some(word => name.includes(word) || description.includes(word) || category.includes(word) || product.benefits && Array.isArray(product.benefits) && product.benefits.some((benefit: string) => benefit.toLowerCase().includes(word)));
        matchesSearch = nameMatch || descMatch || categoryMatch || benefitsMatch || wordMatches;
      }
      let matchesPrice = true;
      try {
        const priceStr = product.price?.toString() || '0';
        const price = parseFloat(priceStr.replace(/[₱,\s]/g, ''));
        matchesPrice = !isNaN(price) && price >= priceRange[0] && price <= priceRange[1];
      } catch (error) {
        matchesPrice = true;
      }
      const matchesCategory = selectedCategory === "All" || product.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesStock = !showInStockOnly || product.inStock;
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = parseFloat((a.price?.toString() || '0').replace(/[₱,\s]/g, ''));
          const priceB = parseFloat((b.price?.toString() || '0').replace(/[₱,\s]/g, ''));
          return (isNaN(priceA) ? 0 : priceA) - (isNaN(priceB) ? 0 : priceB);
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = parseFloat((a.price?.toString() || '0').replace(/[₱,\s]/g, ''));
          const priceB = parseFloat((b.price?.toString() || '0').replace(/[₱,\s]/g, ''));
          return (isNaN(priceB) ? 0 : priceB) - (isNaN(priceA) ? 0 : priceA);
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
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered.sort((a, b) => {
            const aName = a.name?.toLowerCase() || '';
            const bName = b.name?.toLowerCase() || '';
            if (aName.includes(query) && !bName.includes(query)) return -1;
            if (!aName.includes(query) && bName.includes(query)) return 1;
            return 0;
          });
        }
        break;
    }
    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, sortBy, showInStockOnly]);
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
  const priceRangeFromProducts = useMemo(() => {
    if (products.length === 0) return [0, 2000];
    const prices = products.map(p => {
      const priceStr = p.price?.toString() || '0';
      const price = parseFloat(priceStr.replace(/[₱,\s]/g, ''));
      return isNaN(price) ? 0 : price;
    }).filter(price => price > 0);
    if (prices.length === 0) return [0, 2000];
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);
  return <div className="min-h-screen bg-background pb-24">
      {/* Clean Hero Section - Minimal Style */}
      <div className="px-5 pt-6 pb-4 bg-background">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          Find The Best Products
   
  
  
  
   
  
  
   
    
     
  
  
  
  
  
  
  
     
     
      
       
        
     <span className="text-primary">​</span>            ​  
        </h1>
      </div>

      {/* Search Bar - Rounded Style */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search your favorite products" value={searchQuery} onChange={e => handleSearchChange(e.target.value)} onFocus={() => generateSuggestions(searchQuery)} className="pl-11 pr-10 h-12 rounded-2xl bg-muted/50 border-0 placeholder:text-muted-foreground/70 text-sm" />
          {searchQuery && <Button variant="ghost" size="sm" onClick={clearSearch} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full">
              <X className="w-4 h-4" />
            </Button>}
          
          {/* Search suggestions dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && <Card className="absolute top-full left-0 right-0 z-10 mt-2 shadow-lg border-0 rounded-xl overflow-hidden">
              <CardContent className="p-2">
                {searchSuggestions.map((suggestion, index) => <button key={index} className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors" onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion}
                  </button>)}
              </CardContent>
            </Card>}
        </div>
      </div>

      {/* Find Section with Sort */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Find</h2>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-xs text-primary font-medium">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filter</span>
            </button>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-auto h-8 border-0 bg-transparent gap-1 text-xs font-medium text-muted-foreground p-0 pr-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-low">Price ↑</SelectItem>
              <SelectItem value="price-high">Price ↓</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="reviews">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Pills - Horizontal Scroll */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => <button key={category} onClick={() => setSelectedCategory(category)} className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                ${selectedCategory === category ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}
              `}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>)}
        </div>
      </div>

      {/* Advanced filters - collapsible */}
      <div className="px-5">
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="pb-4">
            <Card className="border-0 bg-muted/30 rounded-2xl">
              <CardContent className="p-4 space-y-4">
                {/* Price range filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Price: ₱{priceRange[0]} - ₱{priceRange[1]}
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
      </div>

      {/* Registered Dealers Card - Compact */}
      <div className="px-5 pb-4">
        <Card className="bg-gradient-to-r from-primary to-primary/80 border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 rounded-2xl overflow-hidden" onClick={() => navigate('/dealers')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">Registered Dealers</h3>
                <p className="text-xs text-white/80">Find authorized dealers near you</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid - Modern 2 Column Layout */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} products found
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {loading ? <div className="col-span-2 text-center py-10">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-3 text-sm">Loading products...</p>
            </div> : filteredProducts.length === 0 ? <div className="col-span-2 text-center py-10 space-y-3">
              <Package className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try different keywords" : "Check back later"}
              </p>
              {searchQuery && <Button variant="outline" size="sm" onClick={clearSearch} className="mt-3 rounded-full">
                  Clear search
                </Button>}
            </div> : filteredProducts.map(product => <ProductCard key={product.id} id={product.id} name={product.name} description={product.description} price={product.price} image={product.image} rating={product.rating} reviews={product.reviews} benefits={product.benefits} inStock={product.inStock} featured={product.featured} stockQuantity={product.stockQuantity} lowStockThreshold={product.lowStockThreshold} />)}
        </div>
      </div>

      {/* Mobile Quick Support Card */}
      <div className="px-5 mt-6 mb-2">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Need Help?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our experts are here to help you choose.
                </p>
              </div>
              <Button size="sm" className="text-xs px-4 rounded-full" onClick={() => setShowContactModal(true)}>
                Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Modal */}
      {isMobile ? <Drawer open={showContactModal} onOpenChange={setShowContactModal}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-center text-base font-semibold">
                Field Technicians Directory
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="px-4 pb-6 space-y-3 overflow-y-auto">
              <p className="text-center text-xs text-muted-foreground mb-4">
                Choose a field technician from your region.
              </p>
              
              <div className="space-y-3">
                {contacts.map((contact, index) => <Card key={index} className="transition-all duration-200 active:scale-[0.98] rounded-xl">
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
                        <Button size="sm" className="ml-3 rounded-full" onClick={() => handleCallTechnician(contact.phone.replace(/\s/g, ''), contact.name)}>
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            </div>
          </DrawerContent>
        </Drawer> : <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-center text-lg font-semibold">
                Field Technicians Directory
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Choose a field technician from your region.
              </p>
              
              <div className="space-y-3">
                {contacts.map((contact, index) => <Card key={index} className="transition-all duration-200 hover:shadow-md rounded-xl">
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
                        <Button size="sm" className="rounded-full" onClick={() => handleCallTechnician(contact.phone.replace(/\s/g, ''), contact.name)}>
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            </div>
          </DialogContent>
        </Dialog>}
    </div>;
};
export default Products;