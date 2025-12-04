import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, CreditCard, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  active: boolean;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          toast({
            title: "Error",
            description: "Failed to load product details",
            variant: "destructive"
          });
          return;
        }

        setProduct(data);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  const handleQuantityChange = (increment: boolean) => {
    setQuantity(prev => {
      if (increment) {
        return prev + 1;
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category
    }, quantity);

    toast({
      title: "Added to Cart",
      description: `${quantity} x ${product.name} added to cart`,
    });

    // Auto-scroll to cart icon after a brief delay
    setTimeout(() => {
      const cartIcon = document.getElementById('cart-icon');
      if (cartIcon) {
        cartIcon.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a subtle animation effect
        cartIcon.style.transform = 'scale(1.1)';
        setTimeout(() => {
          cartIcon.style.transform = 'scale(1)';
        }, 200);
      }
    }, 500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    navigate(`/checkout?product=${product.id}&quantity=${quantity}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-2">
        <div className="max-w-lg mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-3"></div>
            <div className="h-48 bg-muted rounded mb-3"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-2">
        <div className="max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/products')}
            className="mb-3 p-2"
            size="sm"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            <span className="text-sm">Back</span>
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold mb-2">Product Not Found</h1>
            <p className="text-sm text-muted-foreground">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 pb-20">{/* Added pb-20 for bottom padding */}
      <div className="max-w-lg mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="mb-3 p-2"
          size="sm"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          <span className="text-sm">Back</span>
        </Button>

        {/* Product Detail Card */}
        <Card className="shadow-sm">
          <CardContent className="p-3">
            {/* Product Image */}
            <div className="mb-4">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {product.category && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {product.category}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold mb-1 leading-tight">{product.name}</h1>
                <p className="text-lg font-bold text-primary mb-3">
                  ₱{product.price?.toFixed(2)}
                </p>
                
                {/* Product Description Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-md">
                    <div className={`${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                      {product.description}
                    </div>
                    {product.description && product.description.length > 150 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="h-6 p-0 mt-2 text-xs text-primary hover:bg-transparent"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            See Less <ChevronUp className="w-3 h-3 ml-1" />
                          </>
                        ) : (
                          <>
                            See More <ChevronDown className="w-3 h-3 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="space-y-2">
                <label className="text-xs font-medium">Quantity</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(false)}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-12 text-center font-medium text-sm">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-10"
                  disabled={!product.active}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  <span className="text-sm">{product.active ? "Add to Cart" : "Out of Stock"}</span>
                </Button>
                
                {product.active && (
                  <Button
                    onClick={handleBuyNow}
                    variant="outline"
                    className="w-full h-10"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span className="text-sm">Buy Now</span>
                  </Button>
                )}
              </div>

              {/* Product Features */}
              <div className="pt-3 border-t">
                <h3 className="text-sm font-semibold mb-2">Features:</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Quality Product</li>
                  <li>• Trusted Brand</li>
                  <li>• Fast Delivery</li>
                  <li>• Customer Support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Extra spacing to ensure content isn't cut off */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default ProductDetail;