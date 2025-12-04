import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
const Cart = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    items,
    itemCount,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>(items.map(item => item.id));

  // Calculate selected items stats
  const selectedStats = useMemo(() => {
    const selected = items.filter(item => selectedItems.includes(item.id));
    const count = selected.reduce((sum, item) => sum + item.quantity, 0);
    const total = selected.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      count,
      total,
      items: selected
    };
  }, [items, selectedItems]);
  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => checked ? [...prev, itemId] : prev.filter(id => id !== itemId));
  };
  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? items.map(item => item.id) : []);
  };
  const handleCheckout = () => {
    if (selectedStats.items.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to checkout",
        variant: "destructive"
      });
      return;
    }

    // Navigate to checkout with selected items data
    const checkoutData = {
      items: selectedStats.items,
      fromCart: true
    };

    // Pass data via state to checkout page
    navigate('/checkout', {
      state: checkoutData
    });
  };
  const handleContinueShopping = () => {
    navigate('/products');
  };
  if (items.length === 0) {
    return <div className="min-h-screen bg-background p-2">
        <div className="max-w-lg mx-auto">
          

          <div className="text-center py-8">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Add some products to get started
            </p>
            <Button onClick={handleContinueShopping}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background p-2 pb-24">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-3 p-2" size="sm">
          <ArrowLeft className="w-3 h-3 mr-1" />
          <span className="text-sm">Back</span>
        </Button>

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Cart ({itemCount} items)</h1>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
            Clear All
          </Button>
        </div>

        {/* Select All Checkbox */}
        <div className="flex items-center space-x-2 mb-3 p-2 bg-muted/50 rounded-lg">
          <Checkbox id="select-all" checked={selectedItems.length === items.length} onCheckedChange={handleSelectAll} />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({selectedStats.count} of {itemCount} items selected)
          </label>
        </div>

        <div className="space-y-3 mb-6">
          {items.map(item => <Card key={item.id} className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex space-x-3">
                  <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={checked => handleSelectItem(item.id, checked as boolean)} className="mt-2" />
                  <img src={item.image_url || "/placeholder.svg"} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-sm leading-tight mb-1">
                      {item.name}
                    </h3>
                    <p className="text-primary font-bold text-sm mb-2">
                      ₱{item.price.toFixed(2)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-6 w-6 p-0">
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-6 w-6 p-0">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Cart Summary */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({selectedStats.count} selected items)</span>
                <span>₱{selectedStats.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">₱{selectedStats.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button onClick={handleCheckout} className="w-full h-10">
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Checkout
          </Button>
          
          <Button onClick={handleContinueShopping} variant="outline" className="w-full h-10">
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>;
};
export default Cart;