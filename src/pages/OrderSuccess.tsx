import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const navigate = useNavigate();

  const handleCheckStatus = () => {
    navigate("/my-purchase");
  };

  return (
    <div className="fixed inset-0 bg-gradient-botanical flex items-center justify-center px-4 overflow-hidden">
      <div className="max-w-sm w-full text-center">
        <div className="bg-card rounded-2xl shadow-xl px-6 pt-4 pb-6 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle className="h-24 w-24 text-green-500" />
              <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Order Placed Successfully!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your order has been placed successfully!
            </p>
          </div>

          {/* Success message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              Thank you for your purchase! You will receive an email confirmation shortly with your order details.
            </p>
          </div>

          {/* Check Status Button */}
          <Button 
            onClick={handleCheckStatus}
            className="w-full h-12 text-lg font-semibold"
          >
            Check Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;