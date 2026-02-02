import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Search, Mic, MicOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Type declarations for Web Speech API
type SpeechRecognitionType = typeof window.SpeechRecognition;

interface GreetingHeaderProps {
  firstName?: string;
  avatarUrl?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
};

// Get SpeechRecognition constructor (cross-browser)
const getSpeechRecognition = (): SpeechRecognitionType | null => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export const GreetingHeader = ({
  firstName,
  avatarUrl,
  searchQuery,
  onSearchChange,
}: GreetingHeaderProps) => {
  const { toast } = useToast();
  const greeting = getTimeBasedGreeting();
  const displayName = firstName && firstName.trim() !== '' ? firstName : "Farmer";
  const today = format(new Date(), "EEEE, dd MMM yyyy");
  const initials = displayName.slice(0, 2).toUpperCase();

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    // Check if Web Speech API is supported
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionConstructor = getSpeechRecognition();
    
    if (!SpeechRecognitionConstructor) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice search is not supported in this browser.",
      });
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === "not-allowed") {
        toast({
          variant: "destructive",
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice search.",
        });
      } else if (event.error !== "aborted") {
        toast({
          variant: "destructive",
          title: "Voice Search Error",
          description: "Could not recognize speech. Please try again.",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
    }
  }, [onSearchChange, toast]);

  return (
    <div className="bg-primary px-4 pt-6 pb-10 rounded-b-3xl">
      {/* Greeting Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-primary-foreground">
            Hello {displayName}, {greeting}
          </h1>
          <p className="text-xs text-primary-foreground/70">{today}</p>
        </div>
        <Avatar className="w-10 h-10 border-2 border-primary-foreground/30">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Search Bar with Voice Input */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isListening ? "Listening..." : "Search news, products..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 h-11 bg-background border-0 rounded-xl placeholder:text-muted-foreground/70"
          />
        </div>
        {speechSupported && (
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "secondary"}
            className="h-11 w-11 rounded-xl shrink-0"
            onClick={startListening}
            disabled={isListening}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
