import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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
  description,
  price,
  image,
  rating,
  reviews,
  benefits,
  inStock,
  featured = false,
  stockQuantity = 0,
  lowStockThreshold = 5,
}: ProductCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/products/${id}`);
  };

  return (
    <Card 
      className="group cursor-pointer transition-smooth hover:scale-[1.02] active:scale-[0.98] touch-manipulation rounded-lg"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={name}
            className="w-full h-32 object-cover transition-smooth group-hover:scale-105 rounded-t-lg"
          />
          {featured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-white text-xs px-2 py-1">
                Featured
              </Badge>
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs px-2 py-1">Out of Stock</Badge>
            </div>
          )}
          {inStock && stockQuantity <= lowStockThreshold && stockQuantity > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-warning/90 text-warning-foreground">
                Low Stock
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-smooth line-clamp-2">
              {name}
            </h3>
            <div className="text-base font-bold text-foreground">{price}</div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {benefits.slice(0, 2).map((benefit, index) => (
              <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0.5 h-4">
                {benefit}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;