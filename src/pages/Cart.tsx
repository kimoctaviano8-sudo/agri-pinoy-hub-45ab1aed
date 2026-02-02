import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, CreditCard, Truck, Gift, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useVacationModeContext } from "@/contexts/VacationModeContext";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { useOffers, getOfferProgress } from "@/hooks/useOffers";
import { AppliedOffersDisplay, OfferProgressDisplay } from "@/components/AppliedOffersDisplay";

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vacationMode, vacationMessage } = useVacationModeContext();
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

  // Get offers for selected items
  const offers = useOffers(selectedStats.items);
  const offerProgress = getOfferProgress(selectedStats.count, offers.discountRules);
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
    return <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto">
          

          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-5" />
            <h1 className="text-lg font-bold mb-3">Your cart is empty</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Add some products to get started
            </p>
            <Button onClick={handleContinueShopping}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 p-2" size="sm">
          <ArrowLeft className="w-3 h-3 mr-1.5" />
          <span className="text-sm">Back</span>
        </Button>

        <div className="flex justify-between items-center mb-5">
          <h1 className="text-lg font-bold">Cart ({itemCount} items)</h1>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
            Clear All
          </Button>
        </div>

        {/* Select All Checkbox */}
        <div className="flex items-center space-x-3 mb-4 p-3 bg-muted/50 rounded-lg">
          <Checkbox id="select-all" checked={selectedItems.length === items.length} onCheckedChange={handleSelectAll} />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({selectedStats.count} of {itemCount} items selected)
          </label>
        </div>

        <div className="space-y-4 mb-6">
          {items.map(item => <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={checked => handleSelectItem(item.id, checked as boolean)} className="mt-2" />
                  <img src={item.image_url || "/placeholder.svg"} alt={item.name} className="w-18 h-18 object-cover rounded-lg" />
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-sm leading-snug mb-1.5">
                      {item.name}
                    </h3>
                    <p className="text-primary font-bold text-sm mb-3">
                      ₱{item.price.toFixed(2)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 p-0">
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 p-0">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Applied Offers */}
        {offers.appliedOffers.length > 0 && (
          <AppliedOffersDisplay 
            appliedOffers={offers.appliedOffers} 
            showDetails={true}
            className="mb-4"
          />
        )}

        {/* Offer Progress */}
        {offerProgress.length > 0 && (
          <OfferProgressDisplay progress={offerProgress} className="mb-4" />
        )}

        {/* Cart Summary */}
        <Card className="shadow-sm mb-5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({selectedStats.count} selected items)</span>
                <span>₱{selectedStats.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                {offers.hasFreeShipping ? (
                  <span className="flex items-center gap-1.5">
                    <span className="line-through text-muted-foreground">₱{offers.originalShippingFee.toFixed(2)}</span>
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">FREE</Badge>
                  </span>
                ) : (
                  <span>₱{offers.originalShippingFee.toFixed(2)}</span>
                )}
              </div>
              {offers.freeProducts.length > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3 h-3" />
                    Free Product{offers.freeProducts.length > 1 ? 's' : ''}
                  </span>
                  <span>+{offers.freeProducts.length}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">₱{(selectedStats.total + offers.finalShippingFee).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacation Mode Banner */}
        {vacationMode && (
          <Card className="bg-warning/10 border-warning/30 mb-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Palmtree className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning mb-0.5">Orders Temporarily Paused</p>
                  <p className="text-xs text-muted-foreground">{vacationMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!vacationMode && (
            <Button onClick={handleCheckout} className="w-full h-11">
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Checkout
            </Button>
          )}
          
          <Button onClick={handleContinueShopping} variant="outline" className="w-full h-11">
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>;
};
export default Cart;