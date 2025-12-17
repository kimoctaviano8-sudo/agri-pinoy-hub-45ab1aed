import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RatingCategory {
  name: string;
  rating: number;
}

export function RatingModal({ open, onOpenChange }: RatingModalProps) {
  const [categories, setCategories] = useState<RatingCategory[]>([
    { name: "Communication", rating: 0 },
    { name: "Punctuality", rating: 0 },
    { name: "Eye for Detail", rating: 0 },
    { name: "Efficiency", rating: 0 }
  ]);
  const [feedback, setFeedback] = useState("");

  const updateRating = (categoryIndex: number, rating: number) => {
    setCategories(prev => prev.map((cat, index) => 
      index === categoryIndex ? { ...cat, rating } : cat
    ));
  };

  const handleSubmit = () => {
    // Rating data is processed locally - no sensitive data logged
    toast({
      title: "Thank you!",
      description: "Your rating has been submitted successfully."
    });
    
    // Reset form and close modal
    setCategories(prev => prev.map(cat => ({ ...cat, rating: 0 })));
    setFeedback("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form and close modal
    setCategories(prev => prev.map(cat => ({ ...cat, rating: 0 })));
    setFeedback("");
    onOpenChange(false);
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="transition-colors hover:scale-110 duration-200"
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating
                  ? "fill-orange-400 text-orange-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Rate Our App!</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            How was the reliability and quality of work?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {categories.map((category, index) => (
            <div key={category.name} className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">{category.name}</h4>
              <StarRating
                rating={category.rating}
                onRatingChange={(rating) => updateRating(index, rating)}
              />
            </div>
          ))}
          
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}