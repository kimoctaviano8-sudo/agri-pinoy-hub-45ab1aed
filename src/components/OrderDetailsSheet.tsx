import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, CreditCard, Calendar, Package } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface ShippingAddress {
  street_number: string;
  barangay: string;
  city: string;
  phone: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  payment_method: string;
  shipping_fee?: number;
  voucher_discount?: number;
  voucher_code?: string;
}

interface OrderDetailsSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailsSheet = ({ order, open, onOpenChange }: OrderDetailsSheetProps) => {
  if (!order) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'to_pay': return 'destructive';
      case 'to_ship': return 'secondary';
      case 'to_receive': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'secondary';
      case 'return_refund': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'to_pay': return 'To Pay';
      case 'to_ship': return 'To Ship';
      case 'to_receive': return 'To Receive';
      case 'completed': return 'Completed';
      case 'pending_cancellation': return 'Pending Cancellation';
      case 'cancelled': return 'Cancelled';
      case 'return_refund': return 'Return/Refund';
      default: return status;
    }
  };

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = (order as any).shipping_fee || 50;
  const voucherDiscount = (order as any).voucher_discount || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order Number</span>
              <span className="font-medium">#{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {getStatusDisplayName(order.status)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Order Date
              </span>
              <span className="text-sm">
                {new Date(order.created_at).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Items Ordered</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    ₱{item.price.toFixed(2)} × {item.quantity} = ₱{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Shipping Address */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </h3>
            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
              <p>{order.shipping_address.street_number}</p>
              <p>{order.shipping_address.barangay}</p>
              <p>{order.shipping_address.city}</p>
              {order.shipping_address.phone && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {order.shipping_address.phone}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </h3>
            <p className="text-sm capitalize bg-muted/50 p-3 rounded-lg">
              {order.payment_method.replace(/_/g, ' ')}
            </p>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Order Summary</h3>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping Fee</span>
                <span>₱{shippingFee.toFixed(2)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Voucher Discount {(order as any).voucher_code && `(${(order as any).voucher_code})`}</span>
                  <span>-₱{voucherDiscount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">₱{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsSheet;
