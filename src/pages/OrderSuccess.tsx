import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type PaymentStatus = 'success' | 'failed' | 'pending' | 'cancelled' | 'default';

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('default');
  const [isLoading, setIsLoading] = useState(true);

  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const processPaymentResult = async () => {
      // If we have status from PayMongo redirect
      if (status && orderId) {
        if (status === 'success') {
          // Payment was successful, update order status
          try {
            const { error } = await supabase
              .from('orders')
              .update({ status: 'paid' })
              .eq('id', orderId);

            if (error) {
              console.error('Error updating order:', error);
              setPaymentStatus('pending');
            } else {
              setPaymentStatus('success');
              toast({
                title: "Payment Successful",
                description: "Your payment has been processed successfully.",
              });
            }
          } catch (error) {
            console.error('Error processing payment result:', error);
            setPaymentStatus('pending');
          }
        } else if (status === 'failed') {
          setPaymentStatus('failed');
          // Update order status to failed
          try {
            await supabase
              .from('orders')
              .update({ status: 'payment_failed' })
              .eq('id', orderId);
          } catch (error) {
            console.error('Error updating failed order:', error);
          }
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
        } else if (status === 'cancelled') {
          setPaymentStatus('cancelled');
          toast({
            title: "Payment Cancelled",
            description: "Your payment was cancelled.",
            variant: "destructive",
          });
        }
      } else {
        // No status params - this is a COD or Bank Transfer order
        setPaymentStatus('default');
      }
      setIsLoading(false);
    };

    processPaymentResult();
  }, [status, orderId, toast]);

  const handleCheckStatus = () => {
    navigate("/my-purchase");
  };

  const handleTryAgain = () => {
    navigate("/cart");
  };

  const statusConfigs: Record<PaymentStatus, StatusConfig> = {
    success: {
      icon: <CheckCircle className="h-24 w-24 text-green-500" />,
      title: "Payment Successful!",
      message: "Your payment has been processed and your order is confirmed.",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
    },
    failed: {
      icon: <XCircle className="h-24 w-24 text-red-500" />,
      title: "Payment Failed",
      message: "We couldn't process your payment. Please try again or choose a different payment method.",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
    },
    pending: {
      icon: <Clock className="h-24 w-24 text-yellow-500" />,
      title: "Payment Processing",
      message: "Your payment is being processed. We'll update your order status once confirmed.",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700",
    },
    cancelled: {
      icon: <AlertCircle className="h-24 w-24 text-orange-500" />,
      title: "Payment Cancelled",
      message: "Your payment was cancelled. Your order has not been processed.",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
    },
    default: {
      icon: <CheckCircle className="h-24 w-24 text-green-500" />,
      title: "Order Placed Successfully!",
      message: "Your order has been placed successfully!",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
    },
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-botanical flex items-center justify-center px-4 overflow-hidden">
        <div className="max-w-sm w-full text-center">
          <div className="bg-card rounded-2xl shadow-xl px-6 pt-4 pb-6 space-y-6">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-lg text-muted-foreground">Processing your order...</p>
          </div>
        </div>
      </div>
    );
  }

  const config = statusConfigs[paymentStatus];

  return (
    <div className="fixed inset-0 bg-gradient-botanical flex items-center justify-center px-4 overflow-hidden">
      <div className="max-w-sm w-full text-center">
        <div className="bg-card rounded-2xl shadow-xl px-6 pt-4 pb-6 space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            <div className="relative">
              {config.icon}
              <div className={`absolute inset-0 rounded-full border-4 ${config.borderColor.replace('border-', 'border-')}/20 animate-pulse`} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              {config.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {config.message}
            </p>
          </div>

          {/* Status message */}
          <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
            <p className={`text-sm ${config.textColor}`}>
              {paymentStatus === 'success' || paymentStatus === 'default'
                ? "Thank you for your purchase! You will receive an email confirmation shortly with your order details."
                : paymentStatus === 'failed' || paymentStatus === 'cancelled'
                ? "If you were charged, please contact our support team for assistance."
                : "Please wait while we confirm your payment. This may take a few moments."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleCheckStatus}
              className="w-full h-12 text-lg font-semibold"
            >
              Check Order Status
            </Button>
            
            {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
              <Button 
                onClick={handleTryAgain}
                variant="outline"
                className="w-full h-12 text-lg font-semibold"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;