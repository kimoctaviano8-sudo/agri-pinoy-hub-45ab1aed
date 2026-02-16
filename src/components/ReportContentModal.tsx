import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";

const REPORT_REASONS = [
  "Hate speech or discrimination",
  "Harassment or bullying",
  "Spam or misleading content",
  "Inappropriate or explicit content",
  "Misinformation",
  "Other",
];

interface ReportContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
  type: "post" | "comment";
}

export const ReportContentModal = ({ open, onOpenChange, onSubmit, type }: ReportContentModalProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmit(reason, details);
      setReason("");
      setDetails("");
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
            <Flag className="w-5 h-5 text-destructive" />
            <DialogTitle>Report {type === "post" ? "Post" : "Comment"}</DialogTitle>
          </div>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Reason for reporting</Label>
            <div className="grid gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                    reason === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50 text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Additional details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              className="resize-none min-h-[80px] text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="w-full"
            variant="destructive"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
