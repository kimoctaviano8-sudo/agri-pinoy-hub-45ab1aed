import { useState } from "react";
import { Package, AlertTriangle, Plus, Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
  category: string;
}

interface StockManagementProps {
  products: Product[];
  onRefresh: () => void;
}

export const StockManagement = ({ products, onRefresh }: StockManagementProps) => {
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold);
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return { status: "Out of Stock", variant: "destructive" as const, icon: <AlertTriangle className="w-3 h-3" /> };
    } else if (product.stock_quantity <= product.low_stock_threshold) {
      return { status: "Low Stock", variant: "secondary" as const, icon: <AlertTriangle className="w-3 h-3" /> };
    } else {
      return { status: "In Stock", variant: "default" as const, icon: <Package className="w-3 h-3" /> };
    }
  };

  const handleRestock = async () => {
    if (!selectedProduct || !restockQuantity) return;

    const quantity = parseInt(restockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid positive number",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock_quantity: selectedProduct.stock_quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Stock Updated",
        description: `Added ${quantity} units to ${selectedProduct.name}`,
      });

      setRestockDialogOpen(false);
      setSelectedProduct(null);
      setRestockQuantity("");
      onRefresh();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickAdjust = async (product: Product, adjustment: number) => {
    const newQuantity = Math.max(0, product.stock_quantity + adjustment);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Stock Updated",
        description: `${product.name} stock ${adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)}`,
      });

      onRefresh();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl md:text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl md:text-2xl font-bold text-warning">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-xl md:text-2xl font-bold text-destructive">{outOfStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-warning text-base md:text-lg">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock: {product.stock_quantity} / Threshold: {product.low_stock_threshold}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto shrink-0"
                    onClick={() => {
                      setSelectedProduct(product);
                      setRestockDialogOpen(true);
                    }}
                  >
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Products Stock Management */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Stock Management</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-3">
            {products.map((product) => {
              const stockInfo = getStockStatus(product);
              
              return (
                <div key={product.id} className="flex flex-col gap-3 p-3 border rounded-lg">
                  {/* Product Info */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h4 className="font-medium text-sm flex-1 min-w-0 truncate">{product.name}</h4>
                      <Badge variant={stockInfo.variant} className="text-xs shrink-0">
                        <span className="flex items-center gap-1">
                          {stockInfo.icon}
                          <span className="hidden sm:inline">{stockInfo.status}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Stock: {product.stock_quantity}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate max-w-[120px] sm:max-w-none">Category: {product.category}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>₱{product.price}</span>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    {/* Quick Adjust */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:inline">Quick adjust:</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickAdjust(product, -1)}
                          disabled={product.stock_quantity === 0}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <span className="text-sm font-mono min-w-[32px] text-center">
                          {product.stock_quantity}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickAdjust(product, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Restock Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => {
                        setSelectedProduct(product);
                        setRestockDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Restock</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="max-w-[425px] w-[calc(100vw-32px)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Restock Product</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm md:text-base truncate">{selectedProduct.name}</h4>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Current stock: <strong>{selectedProduct.stock_quantity}</strong> units
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="restock-quantity" className="text-sm">Quantity to Add</Label>
                <Input
                  id="restock-quantity"
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="Enter quantity to add"
                  className="text-base"
                />
              </div>
              
              {restockQuantity && !isNaN(parseInt(restockQuantity)) && parseInt(restockQuantity) > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs md:text-sm">
                    New stock will be: <strong className="text-primary">{selectedProduct.stock_quantity + parseInt(restockQuantity)}</strong> units
                  </p>
                </div>
              )}
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRestockDialogOpen(false);
                    setRestockQuantity("");
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRestock}
                  disabled={updating || !restockQuantity || parseInt(restockQuantity) <= 0}
                  className="w-full sm:w-auto"
                >
                  {updating ? "Updating..." : "Update Stock"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};