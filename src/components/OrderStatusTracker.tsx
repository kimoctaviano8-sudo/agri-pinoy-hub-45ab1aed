import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Package, Truck, CheckCircle, RotateCcw, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
interface OrderCounts {
  to_pay: number;
  to_ship: number;
  to_receive: number;
  completed: number;
  return_refund: number;
  cancelled: number;
}
const OrderStatusTracker = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    to_pay: 0,
    to_ship: 0,
    to_receive: 0,
    completed: 0,
    return_refund: 0,
    cancelled: 0
  });
  const statusItems = [{
    key: "to_pay" as keyof OrderCounts,
    label: "To Pay",
    icon: Wallet,
    color: "text-green-600"
  }, {
    key: "to_ship" as keyof OrderCounts,
    label: "To Ship",
    icon: Package,
    color: "text-green-600"
  }, {
    key: "to_receive" as keyof OrderCounts,
    label: "To Receive",
    icon: Truck,
    color: "text-green-600"
  }, {
    key: "completed" as keyof OrderCounts,
    label: "Completed",
    icon: CheckCircle,
    color: "text-green-600"
  }];
  useEffect(() => {
    if (user?.id) {
      fetchOrderCounts();
    }
  }, [user?.id]);
  const fetchOrderCounts = async () => {
    if (!user?.id) return;
    try {
      const {
        data: orders,
        error
      } = await supabase.from('orders').select('status').eq('user_id', user.id);
      if (error) {
        console.error('Error fetching order counts:', error);
        return;
      }
      const counts: OrderCounts = {
        to_pay: 0,
        to_ship: 0,
        to_receive: 0,
        completed: 0,
        return_refund: 0,
        cancelled: 0
      };
      orders?.forEach(order => {
        if (order.status in counts) {
          counts[order.status as keyof OrderCounts]++;
        }
      });
      setOrderCounts(counts);
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  };
  const handleStatusClick = (status: string) => {
    navigate('/my-purchase', {
      state: {
        activeTab: status
      }
    });
  };
  return <Card className="w-full mb-6">
      <CardContent className="p-3 pb-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold">My Purchases</h3>
          <button onClick={() => navigate('/my-purchase')} className="text-muted-foreground hover:text-primary transition-colors text-xs">
            View Purchase History
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {statusItems.map(item => {
          const count = orderCounts[item.key];
          const IconComponent = item.icon;
          return <button key={item.key} onClick={() => handleStatusClick(item.key)} className="flex flex-col items-center p-2 rounded-lg hover:bg-muted/50 transition-colors group relative min-h-[60px]">
                <div className="relative mb-1">
                  <IconComponent className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                  {count > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                      {count > 99 ? '99+' : count}
                    </Badge>}
                </div>
                <span className="text-[10px] text-center font-medium leading-tight px-1 whitespace-nowrap">
                  {item.label}
                </span>
              </button>;
        })}
        </div>
      </CardContent>
    </Card>;
};
export default OrderStatusTracker;