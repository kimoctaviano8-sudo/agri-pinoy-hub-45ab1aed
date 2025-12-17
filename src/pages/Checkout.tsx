import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, CreditCard, Truck, Percent, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";
import { useOffers } from "@/hooks/useOffers";
import { AppliedOffersDisplay } from "@/components/AppliedOffersDisplay";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  category?: string;
  isFreeItem?: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const productId = searchParams.get('product');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  
  // Check if coming from cart or single product
  const cartData = location.state as { items: CartItem[]; fromCart: boolean } | null;
  const isFromCart = cartData?.fromCart || false;
  const cartItems = cartData?.items || [];

  const [product, setProduct] = useState<Product | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Form states
  const [address, setAddress] = useState({
    street_number: '',
    barangay: '',
    city: '',
    phone: ''
  });
  const [voucherCode, setVoucherCode] = useState('');
  const MAX_VOUCHER_LENGTH = 50;
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [paymentSubMethod, setPaymentSubMethod] = useState('');
  const [notes, setNotes] = useState('');

  // Pricing states
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [baseShippingFee, setBaseShippingFee] = useState(50); // Default, will be fetched from DB

  // Get offers based on checkout items
  const offers = useOffers(checkoutItems);
  const effectiveShippingFee = offers.hasFreeShipping ? 0 : baseShippingFee;
  // Use refs to track if initial data has been loaded to prevent re-fetching
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    if (initialDataLoaded) return;

    const fetchData = async () => {
      // Fetch shipping fee from fees table
      try {
        const { data: feeData } = await supabase
          .from('fees')
          .select('fee_value')
          .eq('fee_type', 'shipping')
          .eq('active', true)
          .single();
        
        if (feeData) {
          setBaseShippingFee(feeData.fee_value);
        }
      } catch (error) {
        console.error('Error fetching shipping fee:', error);
      }

      // Handle cart checkout
      if (isFromCart) {
        if (cartItems.length === 0) {
          navigate('/cart');
          return;
        }
        setCheckoutItems(cartItems);
        setLoading(false);
      }
      // Handle single product checkout
      else if (productId) {
        try {
          // Fetch product
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          if (productError) throw productError;
          setProduct(productData);
          
          // Convert single product to cart item format
          setCheckoutItems([{
            id: productData.id,
            name: productData.name,
            price: productData.price,
            image_url: productData.image_url,
            quantity: quantity
          }]);
        } catch (error) {
          console.error('Error fetching product:', error);
          toast({
            title: "Error",
            description: "Failed to load product data",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/products');
        return;
      }

      // Fetch user profile if logged in
      if (user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!profileError && profileData) {
            setUserProfile(profileData);
            // Prefill address fields from profile
            setAddress({
              street_number: profileData.street_number || '',
              barangay: profileData.barangay || '',
              city: profileData.city || '',
              phone: profileData.phone || '',
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }

      setInitialDataLoaded(true);
    };

    fetchData();
  }, [initialDataLoaded, productId, isFromCart, user, navigate, toast, quantity]);

  // Sanitize voucher code: alphanumeric, dots, and hyphens only, max 50 chars
  const sanitizeVoucherCode = (code: string): string => {
    return code.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, MAX_VOUCHER_LENGTH).toUpperCase();
  };

  const handleVoucherApply = async () => {
    const sanitizedCode = sanitizeVoucherCode(voucherCode);
    if (!sanitizedCode.trim()) return;

    const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const currentDate = new Date();
    
    try {
      // Check monthly sales first
      const { data: monthlySale, error: saleError } = await supabase
        .from('monthly_sales')
        .select('*')
        .eq('event_code', sanitizedCode)
        .eq('active', true)
        .single();

      if (monthlySale && !saleError) {
        const startDate = new Date(monthlySale.valid_date_start);
        const endDate = new Date(monthlySale.valid_date_end);
        
        if (currentDate >= startDate && currentDate <= endDate) {
          const discountAmount = subtotal * (monthlySale.discount_percentage / 100);
          setVoucherDiscount(discountAmount);
          toast({
            title: "Monthly Sale Applied!",
            description: `${monthlySale.discount_percentage}% discount has been applied to your order`
          });
          return;
        } else {
          toast({
            title: "Sale Not Active",
            description: "This monthly sale is not currently active",
            variant: "destructive"
          });
          return;
        }
      }

      // Check vouchers table
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', sanitizedCode)
        .eq('active', true)
        .single();

      if (voucher && !voucherError) {
        // Check if voucher hasn't started yet
        if (voucher.valid_from && new Date(voucher.valid_from) > currentDate) {
          toast({
            title: "Voucher Not Yet Active",
            description: "This voucher is not yet active",
            variant: "destructive"
          });
          return;
        }

        // Check if voucher has expired
        if (voucher.expires_at && new Date(voucher.expires_at) < currentDate) {
          toast({
            title: "Voucher Expired",
            description: "This voucher has expired",
            variant: "destructive"
          });
          return;
        }

        // Check minimum purchase requirement
        if (subtotal < voucher.min_purchase) {
          toast({
            title: "Minimum Purchase Not Met",
            description: `This voucher requires a minimum purchase of ₱${voucher.min_purchase.toFixed(2)}`,
            variant: "destructive"
          });
          return;
        }

        // Check usage limit
        if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
          toast({
            title: "Voucher Limit Reached",
            description: "This voucher has reached its usage limit",
            variant: "destructive"
          });
          return;
        }

        // Calculate discount
        let discountAmount = 0;
        if (voucher.discount_type === 'percentage') {
          discountAmount = subtotal * (voucher.discount_value / 100);
          if (voucher.max_discount) {
            discountAmount = Math.min(discountAmount, voucher.max_discount);
          }
        } else {
          discountAmount = voucher.discount_value;
        }

        setVoucherDiscount(discountAmount);
        toast({
          title: "Voucher Applied!",
          description: `₱${discountAmount.toFixed(2)} discount has been applied to your order`
        });
        return;
      }

      // If no valid voucher or sale found
      toast({
        title: "Invalid Voucher",
        description: "The voucher code you entered is not valid or has expired",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error validating voucher:', error);
      toast({
        title: "Error",
        description: "Failed to validate voucher code",
        variant: "destructive"
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) return;

    // Validate required fields
    if (!address.street_number || !address.barangay || !address.city || !address.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all address fields",
        variant: "destructive"
      });
      return;
    }

    // Validate PayMongo sub-method selection
    if (paymentMethod === 'paymongo' && !paymentSubMethod) {
      toast({
        title: "Select Payment Option",
        description: "Please select a payment option (GCash, Maya, or Card)",
        variant: "destructive"
      });
      return;
    }

    // Validate bank transfer selection
    if (paymentMethod === 'bank_transfer' && !paymentSubMethod) {
      toast({
        title: "Select Bank",
        description: "Please select a bank for transfer",
        variant: "destructive"
      });
      return;
    }

    setProcessingPayment(true);

    try {
      // Combine all items to check (including free products)
      const allItemsToCheck = [
        ...checkoutItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
        ...offers.freeProducts.map(fp => ({ id: fp.id, name: fp.name, quantity: fp.quantity }))
      ];

      // Check stock availability for all items (including free products) before placing order
      const stockChecks = await Promise.all(
        allItemsToCheck.map(async (item) => {
          const { data: product, error } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.id)
            .single();
          
          if (error) throw error;
          
          return {
            id: item.id,
            name: item.name,
            requestedQuantity: item.quantity,
            availableStock: product?.stock_quantity || 0
          };
        })
      );

      // Check if any items have insufficient stock
      const insufficientStockItems = stockChecks.filter(
        item => item.availableStock < item.requestedQuantity
      );

      if (insufficientStockItems.length > 0) {
        const itemNames = insufficientStockItems.map(item => 
          `${item.name} (requested: ${item.requestedQuantity}, available: ${item.availableStock})`
        ).join(', ');
        
        toast({
          title: "Insufficient Stock",
          description: `Not enough stock for: ${itemNames}`,
          variant: "destructive"
        });
        setProcessingPayment(false);
        return;
      }

      // Generate order number
      const orderNumber = `ORD${Date.now()}`;
      
      // Determine initial order status based on payment method
      // COD: 'to_pay' - order confirmed, payment on delivery
      // PayMongo: 'pending_payment' - waiting for online payment
      // Bank Transfer: 'pending_payment' - waiting for bank transfer verification
      let initialStatus = 'pending_payment';
      if (paymentMethod === 'cash_on_delivery') {
        initialStatus = 'to_pay';
      }
      
      // Determine the stored payment method name
      let storedPaymentMethod = paymentMethod;
      if (paymentMethod === 'paymongo') {
        storedPaymentMethod = `paymongo_${paymentSubMethod}`;
      } else if (paymentMethod === 'bank_transfer') {
        storedPaymentMethod = `bank_transfer_${paymentSubMethod}`;
      }
      
      // Combine checkout items with free products for the order
      const allOrderItems = [
        ...checkoutItems,
        ...offers.freeProducts.map(fp => ({
          id: fp.id,
          name: fp.name,
          price: 0, // Free item
          image_url: fp.image_url,
          quantity: fp.quantity,
          isFreeItem: true
        }))
      ];
      
      // Save order to database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          order_number: orderNumber,
          items: JSON.parse(JSON.stringify(allOrderItems)),
          total_amount: finalAmount,
          shipping_address: JSON.parse(JSON.stringify(address)),
          payment_method: storedPaymentMethod,
          voucher_code: voucherCode || null,
          voucher_discount: voucherDiscount,
          shipping_fee: effectiveShippingFee,
          notes: notes || null,
          status: initialStatus
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Handle PayMongo payments
      if (paymentMethod === 'paymongo') {
        const paymongoMethod = paymentSubMethod === 'credit_debit' ? 'card' : paymentSubMethod;
        
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        const response = await fetch(
          `https://bywimfvrbcjcktqzdvmk.supabase.co/functions/v1/create-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              amount: finalAmount,
              paymentMethod: paymongoMethod,
              orderId: orderData.id,
              description: `Order ${orderNumber}`,
              redirectUrl: `${window.location.origin}/order-success`,
            }),
          }
        );

        const paymentResult = await response.json();

        if (!response.ok) {
          // Update order status to payment_failed
          await supabase
            .from('orders')
            .update({ status: 'payment_failed' })
            .eq('id', orderData.id);

          toast({
            title: "Payment Error",
            description: paymentResult.error || "Failed to initiate payment",
            variant: "destructive"
          });
          setProcessingPayment(false);
          return;
        }

        // Redirect to PayMongo checkout
        if (paymentResult.checkoutUrl) {
          window.location.href = paymentResult.checkoutUrl;
          return;
        }
      }

      // Handle Bank Transfer via PayMongo DOB
      if (paymentMethod === 'bank_transfer') {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        toast({
          title: "Processing Payment",
          description: "Redirecting to bank authentication...",
        });

        const response = await fetch(
          `https://bywimfvrbcjcktqzdvmk.supabase.co/functions/v1/create-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              amount: finalAmount,
              paymentMethod: 'bank_transfer',
              bankCode: paymentSubMethod,
              orderId: orderData.id,
              description: `Order ${orderNumber}`,
              redirectUrl: `${window.location.origin}/order-success`,
            }),
          }
        );

        const paymentResult = await response.json();

        if (!response.ok) {
          // Update order status to payment_failed
          await supabase
            .from('orders')
            .update({ status: 'payment_failed' })
            .eq('id', orderData.id);

          toast({
            title: "Payment Error",
            description: paymentResult.error || "Failed to initiate bank transfer",
            variant: "destructive"
          });
          setProcessingPayment(false);
          return;
        }

        // Redirect to PayMongo bank authentication
        if (paymentResult.checkoutUrl) {
          window.location.href = paymentResult.checkoutUrl;
          return;
        }
      }

      // For COD, show success with appropriate message and pass order ID for cart clearing
      if (paymentMethod === 'cash_on_delivery') {
        toast({
          title: "Order Placed Successfully!",
          description: `Total: ₱${finalAmount.toFixed(2)} - Pay when you receive your order.`,
        });
        // Navigate to Order Success page with order ID so cart can be cleared
        navigate(`/order-success?order_id=${orderData.id}`);
        return;
      }
      
      // Navigate to Order Success page (fallback for any other case)
      navigate('/order-success');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading checkout...</div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">No items to checkout</div>
      </div>
    );
  }

  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const finalAmount = subtotal + effectiveShippingFee - voucherDiscount;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 p-2"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-xl font-bold mb-6">Checkout</h1>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkoutItems.map((item, index) => (
                <div key={item.id} className={`flex gap-4 ${index > 0 ? 'border-t pt-4' : ''}`}>
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="font-bold text-primary">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show Free Products */}
              {offers.freeProducts.length > 0 && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Free Items Included</span>
                    </div>
                    {offers.freeProducts.map((freeItem) => (
                      <div key={`free-${freeItem.id}`} className="flex gap-4 mb-3">
                        <img
                          src={freeItem.image_url || "/placeholder.svg"}
                          alt={freeItem.name}
                          className="w-16 h-16 object-cover rounded-md border-2 border-primary/30"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{freeItem.name}</h3>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-muted-foreground">Qty: {freeItem.quantity}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm line-through text-muted-foreground">₱{freeItem.price.toFixed(2)}</span>
                              <Badge variant="secondary" className="bg-primary/10 text-primary">FREE</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street_number">Street/House Number</Label>
                <Input
                  id="street_number"
                  value={address.street_number}
                  onChange={(e) => setAddress(prev => ({ ...prev, street_number: e.target.value }))}
                  placeholder="Enter street/house number"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  value={address.phone}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setAddress((prev) => ({ ...prev, phone: numericValue }));
                  }}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barangay">Barangay</Label>
                <Input
                  id="barangay"
                  value={address.barangay}
                  onChange={(e) => setAddress(prev => ({ ...prev, barangay: e.target.value }))}
                  placeholder="Enter barangay"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Delivery Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special delivery instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Voucher Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Voucher Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={voucherCode}
                onChange={(e) => {
                  // Sanitize input: alphanumeric, dots, hyphens only, max length
                  const sanitized = e.target.value.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, MAX_VOUCHER_LENGTH);
                  setVoucherCode(sanitized.toUpperCase());
                }}
                placeholder="Enter voucher code (e.g., 1.1, 2.2, WELCOME10)"
                maxLength={MAX_VOUCHER_LENGTH}
              />
              <Button onClick={handleVoucherApply} variant="outline">
                Apply
              </Button>
            </div>
            {voucherDiscount > 0 && (
              <p className="text-sm text-green-600 mt-2">
                Voucher applied! You saved ₱{voucherDiscount.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value) => {
                setPaymentMethod(value);
                setPaymentSubMethod(''); // Reset sub-method when changing payment method
              }}
            >
              <div className="space-y-4">
                {/* Cash on Delivery */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">Cash on Delivery</Label>
                  <RadioGroupItem value="cash_on_delivery" id="cod" />
                </div>

                {/* PayMongo */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <Label htmlFor="paymongo" className="flex-1 cursor-pointer">PayMongo</Label>
                    <RadioGroupItem value="paymongo" id="paymongo" />
                  </div>
                  {paymentMethod === 'paymongo' && (
                    <div className="px-3 pb-3 border-t">
                      <Select value={paymentSubMethod} onValueChange={setPaymentSubMethod}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select payment option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qrph">QR Ph (InstaPay/PESONet)</SelectItem>
                          <SelectItem value="gcash">GCash</SelectItem>
                          <SelectItem value="maya">Maya</SelectItem>
                          <SelectItem value="credit_debit">Credit/Debit Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>


                {/* Bank Transfer */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">Bank Transfer</Label>
                    <RadioGroupItem value="bank_transfer" id="bank" />
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <div className="px-3 pb-3 border-t space-y-3">
                      <Select value={paymentSubMethod} onValueChange={setPaymentSubMethod}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bdo">BDO</SelectItem>
                          <SelectItem value="landbank">Landbank</SelectItem>
                          <SelectItem value="metrobank">Metrobank</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Bank Transfer Info */}
                      {paymentSubMethod && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                          <p className="font-medium text-foreground flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Secure Online Banking
                          </p>
                          <p className="text-muted-foreground">
                            You will be redirected to {paymentSubMethod === 'bdo' ? 'BDO' : 
                              paymentSubMethod === 'bpi' ? 'BPI' : 
                              paymentSubMethod === 'landbank' ? 'Landbank' : 'Metrobank'}'s 
                            secure online banking portal to complete your payment.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">PayMongo Secured</span>
                            <span>Fast • Secure • Real-time confirmation</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Product Total ({totalQuantity} item{totalQuantity > 1 ? 's' : ''})</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              {offers.hasFreeShipping ? (
                <span className="flex items-center gap-1">
                  <span className="line-through text-muted-foreground">₱{baseShippingFee.toFixed(2)}</span>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">FREE</Badge>
                </span>
              ) : (
                <span>₱{baseShippingFee.toFixed(2)}</span>
              )}
            </div>
            {offers.freeProducts.length > 0 && (
              <div className="flex justify-between text-primary">
                <span className="flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  Free Product{offers.freeProducts.length > 1 ? 's' : ''}
                </span>
                <span>+{offers.freeProducts.length} item{offers.freeProducts.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Voucher Discount</span>
                <span>-₱{voucherDiscount.toFixed(2)}</span>
              </div>
            )}
            {offers.appliedOffers.length > 0 && (
              <div className="pt-2">
                <AppliedOffersDisplay appliedOffers={offers.appliedOffers} showDetails={false} />
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount</span>
                <span className="text-primary">₱{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Place Order Button */}
        <Button 
          onClick={handlePlaceOrder}
          className="w-full h-12 text-base font-medium"
          size="lg"
          disabled={processingPayment}
        >
          {processingPayment ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Place Order - ₱${finalAmount.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;