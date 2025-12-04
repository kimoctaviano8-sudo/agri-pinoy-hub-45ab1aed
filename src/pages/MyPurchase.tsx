import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";
import CancelOrderModal from "@/components/CancelOrderModal";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }>;
  shipping_address: {
    street_number: string;
    barangay: string;
    city: string;
    phone: string;
  };
  payment_method: string;
}

const MyPurchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(() => {
    return location.state?.activeTab || "to_pay";
  });
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const statusTabs = [
    { value: "to_pay", label: "To Pay", icon: Clock },
    { value: "to_ship", label: "To Ship", icon: Package },
    { value: "to_receive", label: "To Receive", icon: Truck },
    { value: "completed", label: "Completed", icon: CheckCircle },
    { value: "pending_cancellation", label: "Pending Cancellation", icon: RotateCcw },
    { value: "return_refund", label: "Return/Refund", icon: RotateCcw },
    { value: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  useEffect(() => {
    if (!user) return;

    fetchOrders();

    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items as Array<{
          id: string;
          name: string;
          price: number;
          quantity: number;
          image_url: string;
        }> : [],
        shipping_address: typeof order.shipping_address === 'object' && order.shipping_address && !Array.isArray(order.shipping_address) ? order.shipping_address as {
          street_number: string;
          barangay: string;
          city: string;
          phone: string;
        } : {
          street_number: '',
          barangay: '',
          city: '',
          phone: ''
        }
      })) as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load your orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrderClick = (order: Order) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const handleCancelOrderConfirm = async (reason: string, otherReason?: string) => {
    if (!orderToCancel) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'pending_cancellation',
          cancellation_reason: reason,
          cancellation_details: otherReason,
          cancellation_requested_at: new Date().toISOString()
        })
        .eq('id', orderToCancel.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Cancellation Request Submitted",
        description: "Your cancellation request has been submitted for admin approval."
      });

      fetchOrders();
      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Error",
        description: "Failed to submit cancellation request",
        variant: "destructive"
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelModalClose = () => {
    setCancelModalOpen(false);
    setOrderToCancel(null);
  };

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

  const handleConfirmReceived = async (order: Order) => {
    if (!user) return;

    setConfirmingId(order.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Order Completed",
        description: "Thank you for confirming you received your items.",
      });
    } catch (error) {
      console.error('Error confirming order receipt:', error);
      toast({
        title: "Error",
        description: "Failed to confirm order receipt",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const filteredOrders = orders.filter(order => order.status === selectedTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 p-2"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-bold mb-6">My Purchase</h1>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto gap-1 bg-muted p-1 h-auto">
              {statusTabs.map((tab) => {
                const count = orders.filter(order => order.status === tab.value).length;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="flex items-center gap-2 text-xs px-3 py-2 min-w-[90px] h-auto whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
                  >
                    <span className="font-medium">{tab.label}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4 min-w-4 bg-primary text-primary-foreground">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {statusTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="text-muted-foreground">
                        No orders found for "{tab.label}"
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredOrders.map((order) => (
                    <Card key={order.id} className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              Order #{order.order_number}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {getStatusDisplayName(order.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={item.id} className={`flex gap-4 ${index > 0 ? 'border-t pt-3' : ''}`}>
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
                          </div>

                          {/* Order Total */}
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Amount</span>
                              <span className="font-bold text-lg text-primary">₱{order.total_amount.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 justify-end">
                            {order.status === 'to_pay' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCancelOrderClick(order)}
                              >
                                Cancel Order
                              </Button>
                            )}
                            {order.status === 'to_receive' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmReceived(order)}
                                disabled={confirmingId === order.id}
                              >
                                {confirmingId === order.id ? 'Confirming...' : 'Confirm Received'}
                              </Button>
                            )}
                            {order.status === 'completed' && (
                              <Button variant="outline" size="sm">
                                Buy Again
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {order.status !== 'to_pay' && (
                              <Button variant="default" size="sm">
                                Buy Again
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <CancelOrderModal
          isOpen={cancelModalOpen}
          onClose={handleCancelModalClose}
          onConfirm={handleCancelOrderConfirm}
          orderNumber={orderToCancel?.order_number || ""}
          loading={cancelling}
        />
      </div>
    </div>
  );
};

export default MyPurchase;