import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";

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
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');

  // Verify order status from database (source of truth)
  const verifyOrderStatus = useCallback(async (orderIdToCheck: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderIdToCheck)
        .single();

      if (error) {
        console.error('Error fetching order status:', error);
        return null;
      }

      return data?.status || null;
    } catch (error) {
      console.error('Error verifying order status:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const processPaymentResult = async () => {
      // If we have orderId, verify status from database (webhook is source of truth)
      if (orderId) {
        // Wait a bit for webhook to process
        const delay = retryCount * 1000; // Increasing delay: 0s, 1s, 2s, 3s, 4s
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const dbStatus = await verifyOrderStatus(orderId);
        
        if (dbStatus === 'paid') {
          setPaymentStatus('success');
          clearCart(); // Clear cart after successful payment
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
          });
          setIsLoading(false);
          return;
        } else if (dbStatus === 'payment_failed') {
          setPaymentStatus('failed');
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        } else if (dbStatus === 'to_pay') {
          // COD order - successful
          setPaymentStatus('default');
          clearCart();
          setIsLoading(false);
          return;
        } else if (dbStatus === 'pending_payment' || dbStatus === 'pending') {
          // Still pending - check if we got success from redirect
          if (status === 'success' && retryCount < maxRetries) {
            // Webhook hasn't processed yet, retry
            setRetryCount(prev => prev + 1);
            return;
          } else if (status === 'success') {
            // Max retries reached but redirect said success - optimistically update
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .eq('status', 'pending_payment'); // Only update if still pending

              if (!error) {
                setPaymentStatus('success');
                clearCart();
                toast({
                  title: "Payment Successful",
                  description: "Your payment has been processed successfully.",
                });
              } else {
                setPaymentStatus('pending');
              }
            } catch (error) {
              console.error('Error updating order:', error);
              setPaymentStatus('pending');
            }
            setIsLoading(false);
            return;
          } else {
            setPaymentStatus('pending');
            setIsLoading(false);
            return;
          }
        } else if (status === 'failed') {
          setPaymentStatus('failed');
          // Update order status to failed if not already
          try {
            await supabase
              .from('orders')
              .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
              .eq('id', orderId);
          } catch (error) {
            console.error('Error updating failed order:', error);
          }
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        } else if (status === 'cancelled') {
          setPaymentStatus('cancelled');
          toast({
            title: "Payment Cancelled",
            description: "Your payment was cancelled.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else {
        // No orderId - this is a COD or direct navigation
        setPaymentStatus('default');
        clearCart(); // Clear cart for COD orders
        setIsLoading(false);
      }
    };

    processPaymentResult();
  }, [status, orderId, toast, clearCart, verifyOrderStatus, retryCount]);

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
            <p className="text-lg text-muted-foreground">
              {retryCount > 0 ? "Verifying payment status..." : "Processing your order..."}
            </p>
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