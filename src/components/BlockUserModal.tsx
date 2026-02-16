import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldBan, AlertTriangle } from "lucide-react";

interface BlockUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  userName: string;
}

export const BlockUserModal = ({ open, onOpenChange, onConfirm, userName }: BlockUserModalProps) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(reason);
      setReason("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldBan className="w-5 h-5 text-destructive" />
            <DialogTitle>Block {userName}</DialogTitle>
          </div>
          <DialogDescription>
            This user's posts and comments will be hidden from your feed immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Blocking this user will also notify our moderation team, who will review their content within 24 hours.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Reason for blocking (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you're blocking this user..."
              className="resize-none min-h-[80px] text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              variant="destructive"
              className="flex-1"
            >
              {submitting ? "Blocking..." : "Block User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
