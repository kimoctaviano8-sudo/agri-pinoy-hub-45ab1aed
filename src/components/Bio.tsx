import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
interface BioProps {
  bio: string;
  onSave: (newBio: string) => void;
  maxLength?: number;
  className?: string;
}
export function Bio({
  bio,
  onSave,
  maxLength = 200,
  className
}: BioProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(bio);
  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setEditValue(bio);
    setIsEditing(false);
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  return <div className={cn("mb-6", className)}>
      {!isEditing ? <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground text-center leading-relaxed flex-1">
            {bio || "Add a bio to tell others about yourself..."}
          </p>
          
        </div> : <div className="space-y-3">
          <div className="relative">
            <Textarea value={editValue} onChange={e => setEditValue(e.target.value.slice(0, maxLength))} placeholder="Write something about yourself..." className="resize-none text-sm" rows={3} autoFocus />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {editValue.length}/{maxLength}
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="default" size="sm" onClick={handleSave} className="h-8 px-3">
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 px-3">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>}
    </div>;
}