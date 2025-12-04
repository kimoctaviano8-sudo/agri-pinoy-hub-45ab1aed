import { useState, useEffect } from "react";
import { ShoppingCart, CreditCard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import productsImage from "@/assets/products-showcase.jpg";
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  active: boolean;
}
interface RecommendedProductsProps {
  disease: string;
  confidence: number;
}
const RecommendedProducts = ({
  disease,
  confidence
}: RecommendedProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    addToCart
  } = useCart();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Disease to product category mapping
  const diseaseToCategory = {
    'septoria leaf spot': ['fertilizers', 'pest control'],
    'bacterial spot': ['fertilizers', 'pest control'],
    'early blight': ['fertilizers', 'pest control'],
    'late blight': ['fertilizers', 'pest control'],
    'rust': ['fertilizers', 'pest control'],
    'grey leaf spot': ['fertilizers', 'pest control'],
    'northern leaf blight': ['fertilizers', 'pest control'],
    'frogeye leaf spot': ['fertilizers', 'pest control'],
    'downy mildew': ['fertilizers', 'pest control'],
    'black rot': ['fertilizers', 'pest control'],
    'healthy': ['fertilizers', 'growth promoters'],
    'unknown': ['fertilizers', 'pest control']
  };

  // Disease to specific product benefits mapping
  const diseaseToBenefits = {
    'septoria leaf spot': ['Disease Resistance', 'Leaf Protection', 'Fungal Control'],
    'bacterial spot': ['Bio-Safe', 'Bacterial Control', 'Plant Health'],
    'early blight': ['Disease Prevention', 'Immunity Boost', 'Crop Protection'],
    'late blight': ['Disease Resistance', 'Preventive Care', 'Plant Vigor'],
    'rust': ['Rust Control', 'Disease Prevention', 'Crop Health'],
    'grey leaf spot': ['Spot Prevention', 'Leaf Health', 'Disease Control'],
    'northern leaf blight': ['Blight Resistance', 'Disease Prevention', 'Plant Protection'],
    'frogeye leaf spot': ['Spot Control', 'Disease Management', 'Leaf Care'],
    'downy mildew': ['Mildew Control', 'Humidity Protection', 'Disease Prevention'],
    'black rot': ['Rot Prevention', 'Plant Health', 'Disease Control'],
    'healthy': ['Growth Enhancement', 'Nutrient Boost', 'Yield Optimization'],
    'unknown': ['Complete Nutrition', 'Disease Prevention', 'Plant Health']
  };
  useEffect(() => {
    fetchRecommendedProducts();
  }, [disease]);
  const fetchRecommendedProducts = async () => {
    try {
      setLoading(true);
      const normalizedDisease = disease.toLowerCase();
      const relevantCategories = diseaseToCategory[normalizedDisease] || ['fertilizers', 'pest control'];

      // Fetch products from Supabase with real-time sync
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category, active, stock_quantity')
        .eq('active', true)
        .in('category', relevantCategories)
        .gt('stock_quantity', 0) // Only show in-stock products
        .order('stock_quantity', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching products:', error);
        // Fallback to mock products based on disease
        setProducts(getMockRecommendedProducts(normalizedDisease));
      } else if (data && data.length > 0) {
        // Filter out products with invalid data
        const validProducts = data.filter(p => p.name && p.price && p.price > 0);
        if (validProducts.length > 0) {
          setProducts(validProducts);
        } else {
          setProducts(getMockRecommendedProducts(normalizedDisease));
        }
      } else {
        // No products found, use mock data
        setProducts(getMockRecommendedProducts(normalizedDisease));
      }
    } catch (error) {
      console.error('Error:', error);
      setProducts(getMockRecommendedProducts(disease.toLowerCase()));
    } finally {
      setLoading(false);
    }
  };
  const getMockRecommendedProducts = (disease: string): Product[] => {
    const benefits = diseaseToBenefits[disease] || ['Complete Nutrition', 'Disease Prevention', 'Plant Health'];
    if (disease === 'healthy') {
      return [{
        id: 'mock-1',
        name: 'VitalGrow Root Stimulator',
        description: 'Specialized formula that promotes healthy root development and increases nutrient uptake efficiency.',
        price: 780,
        image_url: productsImage,
        category: 'Growth Promoters',
        active: true
      }, {
        id: 'mock-2',
        name: 'HarvestMax Complete Nutrition',
        description: 'All-in-one nutritional solution providing complete macro and micronutrients for all crop stages.',
        price: 1200,
        image_url: productsImage,
        category: 'Fertilizers',
        active: true
      }, {
        id: 'mock-3',
        name: 'GrowMax Premium Foliar Fertilizer',
        description: 'Advanced micronutrient blend designed specifically for rice and corn crops.',
        price: 850,
        image_url: productsImage,
        category: 'Fertilizers',
        active: true
      }];
    }
    return [{
      id: 'mock-1',
      name: 'PlantGuard Bio-Pesticide',
      description: 'Natural pest control solution that protects crops while maintaining environmental safety standards.',
      price: 980,
      image_url: productsImage,
      category: 'Pest Control',
      active: true
    }, {
      id: 'mock-2',
      name: 'CropBoost Liquid Fertilizer',
      description: 'Liquid concentrate with essential NPK nutrients and trace elements for optimal plant growth.',
      price: 720,
      image_url: productsImage,
      category: 'Fertilizers',
      active: true
    }, {
      id: 'mock-3',
      name: 'EcoGrow Organic Soil Enhancer',
      description: '100% organic soil conditioner that improves soil structure and disease resistance.',
      price: 650,
      image_url: productsImage,
      category: 'Soil Enhancers',
      active: true
    }];
  };
  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`
    });
  };
  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    navigate('/cart');
  };
  const getDiseaseIcon = (disease: string) => {
    const normalizedDisease = disease.toLowerCase();
    if (normalizedDisease === 'healthy') {
      return '🌱';
    } else if (normalizedDisease.includes('spot') || normalizedDisease.includes('blight')) {
      return '🍃';
    } else if (normalizedDisease.includes('rust')) {
      return '🔶';
    } else {
      return '🌿';
    }
  };
  const getRecommendationTitle = (disease: string) => {
    const normalizedDisease = disease.toLowerCase();
    if (normalizedDisease === 'healthy') {
      return 'Growth Enhancement Products';
    }
    return 'Treatment Solutions';
  };
  if (loading) {
    return <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 bg-primary rounded-full animate-pulse"></div>
            <span className="ml-2 text-muted-foreground">Loading recommendations...</span>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span>Recommended Products</span>
              
            </div>
            <p className="text-sm font-normal text-muted-foreground mt-1">
              {getRecommendationTitle(disease)} for {disease}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map(product => <div key={product.id} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex gap-3">
              <div className="w-16 h-16 flex-shrink-0">
                <img src={product.image_url || productsImage} alt={product.name} className="w-full h-full object-cover rounded-lg" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
                  {product.description}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-primary">
                    ₱{product.price.toFixed(2)}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-4">
                    {product.category}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button size="sm" onClick={() => handleAddToCart(product)} className="h-7 text-[10px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-medium px-2">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Add Cart
                  </Button>
                  <Button size="sm" onClick={() => handleBuyNow(product)} className="h-7 text-[10px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-medium px-2">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          </div>)}
        
        {products.length === 0 && <div className="text-center py-6">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No recommended products available at the moment.</p>
          </div>}
        
        <div className="pt-2 border-t border-gray-200">
          <Button variant="outline" onClick={() => navigate('/products')} className="w-full text-sm font-medium">
            View All Products
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default RecommendedProducts;