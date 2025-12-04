import React from "react";
import { Trash2, RefreshCw, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCacheManager } from "@/hooks/useCacheManager";

interface CacheManagerProps {
  variant?: "icon" | "text" | "minimal";
  className?: string;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ 
  variant = "icon",
  className = "" 
}) => {
  const { 
    isClearing, 
    clearCache, 
    clearUserData, 
    clearCacheAndReload 
  } = useCacheManager();

  const handleClearAll = () => clearCache({ preserveAuth: true });
  const handleClearUserData = () => clearUserData();
  const handleClearAndReload = () => clearCacheAndReload(true);

  if (variant === "minimal") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearAll}
        disabled={isClearing}
        className={className}
      >
        {isClearing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Clear Cache
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isClearing}
          className={className}
        >
          {isClearing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {variant === "text" && "Cache"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={handleClearUserData}
          disabled={isClearing}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear User Data
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleClearAll}
          disabled={isClearing}
        >
          <Shield className="mr-2 h-4 w-4" />
          Clear Cache (Keep Auth)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleClearAndReload}
          disabled={isClearing}
          className="text-orange-600 dark:text-orange-400"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Clear All & Reload
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};