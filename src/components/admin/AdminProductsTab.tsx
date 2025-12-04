import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, EyeOff, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  created_at: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface AdminProductsTabProps {
  products: Product[];
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export const AdminProductsTab = ({ products, onToggleActive, onDelete }: AdminProductsTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Products</h2>
        <Button size="sm" onClick={() => navigate('/admin/products/new')} className="h-8">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="space-y-3">
        {products.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-medium text-sm leading-tight truncate">{item.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                    <p className="text-sm font-bold text-primary">₱{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      item.stock_quantity === 0 
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : item.stock_quantity <= item.low_stock_threshold
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-success/10 text-success border-success/20'
                    }`}>
                      {item.stock_quantity === 0 
                        ? 'Out of Stock'
                        : item.stock_quantity <= item.low_stock_threshold
                        ? `Low Stock (${item.stock_quantity})`
                        : `In Stock (${item.stock_quantity})`
                      }
                    </span>
                    {item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0 && (
                      <AlertTriangle className="w-3 h-3 text-warning" />
                    )}
                  </div>
                </div>
                <Badge variant={item.active ? "default" : "secondary"} className="text-xs">
                  {item.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => onToggleActive(item.id, item.active)}
                  >
                    {item.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => navigate(`/admin/products/${item.id}`)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {products.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No products yet</p>
          </div>
        )}
      </div>
    </div>
  );
};