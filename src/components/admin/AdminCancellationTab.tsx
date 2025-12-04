import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, X, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CancellationRequest {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  cancellation_reason: string;
  cancellation_details?: string;
  cancellation_requested_at: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }>;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface AdminCancellationTabProps {
  cancellationRequests: CancellationRequest[];
  onRefresh: () => void;
}

export const AdminCancellationTab = ({ cancellationRequests, onRefresh }: AdminCancellationTabProps) => {
  const { toast } = useToast();
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Cancellation Approved",
        description: "The order has been successfully cancelled.",
      });

      onRefresh();
    } catch (error) {
      console.error('Error approving cancellation:', error);
      toast({
        title: "Error",
        description: "Failed to approve cancellation request.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequests(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
        return updated;
      });
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'to_pay' // Reset to original status
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Cancellation Denied",
        description: "The cancellation request has been denied and order restored.",
      });

      onRefresh();
    } catch (error) {
      console.error('Error denying cancellation:', error);
      toast({
        title: "Error",
        description: "Failed to deny cancellation request.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequests(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
        return updated;
      });
    }
  };

  if (cancellationRequests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No pending cancellation requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-semibold">Pending Cancellation Requests</h3>
        <Badge variant="destructive">{cancellationRequests.length}</Badge>
      </div>

      {cancellationRequests.map((request) => (
        <Card key={request.id} className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Order #{request.order_number}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Customer: {request.profiles.full_name} ({request.profiles.email})
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Requested: {new Date(request.cancellation_requested_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="destructive">Pending Approval</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Order Items:</h4>
              {request.items.map((item, index) => (
                <div key={item.id} className={`flex gap-3 ${index > 0 ? 'border-t pt-3' : ''}`}>
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{item.name}</h5>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="font-medium text-sm">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold text-lg text-primary">₱{request.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="bg-muted p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">Cancellation Reason:</h4>
              <p className="text-sm text-foreground font-medium mb-1">{request.cancellation_reason}</p>
              {request.cancellation_details && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Additional details:</p>
                  <p className="text-sm text-foreground italic">{request.cancellation_details}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDenyRequest(request.id)}
                disabled={processingRequests.has(request.id)}
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                {processingRequests.has(request.id) ? "Processing..." : "Deny"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleApproveRequest(request.id)}
                disabled={processingRequests.has(request.id)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                {processingRequests.has(request.id) ? "Processing..." : "Approve Cancellation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};