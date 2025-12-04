import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MapPin } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, otherReason?: string) => void;
  orderNumber: string;
  loading?: boolean;
}

const CancelOrderModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  orderNumber, 
  loading = false 
}: CancelOrderModalProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [showAddressGuidance, setShowAddressGuidance] = useState(false);

  const cancellationReasons = [
    { value: "changed_mind", label: "Changed my mind" },
    { value: "ordered_mistake", label: "Ordered by mistake" },
    { value: "forgot_voucher", label: "Forgot to use a voucher" },
    { value: "better_product", label: "Found a better product" },
    { value: "delivery_slow", label: "Delivery is taking too long" },
    { value: "change_address", label: "Change of delivery address" },
    { value: "other", label: "Other" },
  ];

  const handleReasonChange = (value: string) => {
    setSelectedReason(value);
    setShowAddressGuidance(value === "change_address");
  };

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    const reason = selectedReason === "other" ? otherReason : 
                   cancellationReasons.find(r => r.value === selectedReason)?.label || selectedReason;
    
    onConfirm(reason, selectedReason === "other" ? otherReason : undefined);
  };

  const handleClose = () => {
    setSelectedReason("");
    setOtherReason("");
    setShowAddressGuidance(false);
    onClose();
  };

  const isFormValid = selectedReason && (selectedReason !== "other" || otherReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel order #{orderNumber}? Please select a reason for cancellation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedReason} onValueChange={handleReasonChange}>
            {cancellationReasons.map((reason) => (
              <div key={reason.value} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label 
                  htmlFor={reason.value} 
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="other-reason" className="text-sm font-medium">
                Please specify your reason
              </Label>
              <Textarea
                id="other-reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Enter your reason for cancellation..."
                className="min-h-[80px] resize-none"
              />
            </div>
          )}

          {showAddressGuidance && (
            <div className="bg-muted p-3 rounded-md border border-border">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    Need to change your delivery address?
                  </p>
                  <p className="text-muted-foreground">
                    You can update your delivery address in your profile settings. 
                    Consider doing this before cancelling to avoid placing a new order.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Update Address
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Keep Order
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={!isFormValid || loading}
          >
            {loading ? "Cancelling..." : "Cancel Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelOrderModal;