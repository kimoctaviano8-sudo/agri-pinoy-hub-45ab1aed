import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export type PermissionType = "location" | "camera" | "microphone" | "notifications";

interface PermissionConfig {
  icon: LucideIcon;
  title: string;
  purpose: string;
  details: string[];
}

interface PermissionPurposeDialogProps {
  open: boolean;
  permissionType: PermissionType;
  icon: LucideIcon;
  title: string;
  purpose: string;
  details: string[];
  onAllow: () => void;
  onDeny: () => void;
}

export const PermissionPurposeDialog = ({
  open,
  icon: Icon,
  title,
  purpose,
  details,
  onAllow,
  onDeny,
}: PermissionPurposeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDeny()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-6 gap-0 [&>button]:hidden">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-center text-foreground mb-2">
          {title}
        </h2>

        {/* Purpose */}
        <p className="text-sm text-muted-foreground text-center mb-4">
          {purpose}
        </p>

        {/* Details */}
        {details.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-3 mb-6 space-y-2">
            {details.map((detail, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary mt-0.5 text-xs">•</span>
                <span className="text-xs text-muted-foreground">{detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={onAllow} className="w-full rounded-xl h-11">
            Allow Access
          </Button>
          <Button
            variant="ghost"
            onClick={onDeny}
            className="w-full rounded-xl h-11 text-muted-foreground"
          >
            Not Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
