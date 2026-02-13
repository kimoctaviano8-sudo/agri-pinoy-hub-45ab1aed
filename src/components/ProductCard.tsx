import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useVacationModeContext } from "@/contexts/VacationModeContext";
import { Star, Plus } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  rating: number;
  reviews: number;
  benefits: string[];
  inStock: boolean;
  featured?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

const ProductCard = ({
  id,
  name,
  price,
  image,
  rating,
  inStock,
  featured = false,
  stockQuantity = 0,
  lowStockThreshold = 5,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { vacationMode } = useVacationModeContext();

  const handleClick = () => {
    navigate(`/products/${id}`);
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98] touch-manipulation rounded-2xl border-0 bg-muted/30 overflow-hidden"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        {/* Product Image - Rounded Style */}
        <div className="relative mb-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                Featured
              </Badge>
            </div>
          )}
          
          {/* Stock Indicators - Hidden in Vacation Mode */}
          {!vacationMode && !inStock && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <Badge variant="destructive" className="text-xs px-2 py-1 rounded-full">Out of Stock</Badge>
            </div>
          )}
          {!vacationMode && inStock && stockQuantity <= lowStockThreshold && stockQuantity > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-warning/90 text-warning-foreground rounded-full">
                Low Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          {/* Name and Rating Row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1 text-foreground">
              {name}
            </h3>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
          </div>

          {/* Price */}
          <div className="pt-1">
            <span className="text-base font-bold text-foreground">{price}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
