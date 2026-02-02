import { format } from "date-fns";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

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

export const GreetingHeader = ({
  firstName,
  avatarUrl,
  searchQuery,
  onSearchChange,
}: GreetingHeaderProps) => {
  const greeting = getTimeBasedGreeting();
  const displayName = firstName || "Farmer";
  const today = format(new Date(), "EEEE, dd MMM yyyy");
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="bg-primary px-4 pt-6 pb-10">
      {/* Greeting Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-primary-foreground">
            Hello, {greeting}
          </h1>
          <p className="text-primary-foreground/80 text-sm">{displayName}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-primary-foreground/70">{today}</p>
          <Avatar className="w-10 h-10 border-2 border-primary-foreground/30">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search news, products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-background border-0 rounded-xl placeholder:text-muted-foreground/70"
        />
      </div>
    </div>
  );
};
