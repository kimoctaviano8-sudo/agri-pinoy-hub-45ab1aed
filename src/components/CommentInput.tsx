import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface CommentInputProps {
  postId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  currentUserId: string;
}

export const CommentInput = ({ 
  postId, 
  value, 
  onChange, 
  onSubmit, 
  disabled,
  currentUserId 
}: CommentInputProps) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  // Use typing indicator hook
  useTypingIndicator({
    postId,
    currentUserId,
    isTyping: isTypingRef.current
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Set typing state to true
    if (!isTypingRef.current) {
      isTypingRef.current = true;
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 2000);
  };

  const handleSubmit = () => {
    // Stop typing indicator immediately when submitting
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onSubmit();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      handleSubmit();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <Input 
        placeholder="Add a thoughtful comment..." 
        value={value} 
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        className="flex-1 h-9 bg-background/80 border-border/60 focus:border-primary/60 rounded-full px-4 text-sm" 
      />
      <Button 
        size="sm" 
        onClick={handleSubmit} 
        disabled={disabled} 
        className="h-9 w-9 p-0 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
      >
        <Send className="w-4 h-4" />
      </Button>
    </>
  );
};