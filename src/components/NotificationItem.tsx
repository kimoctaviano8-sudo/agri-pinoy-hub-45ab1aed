import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  id: string;
  type: 'reaction' | 'comment' | 'support_ticket';
  message: string;
  createdAt: string;
  read: boolean;
  onDismiss: (id: string) => void;
  onClick: (id: string) => void;
  isVisible: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  message,
  createdAt,
  read,
  onDismiss,
  onClick,
  isVisible
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reaction':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'support_ticket':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-xl shadow-elevated transition-all duration-500 ease-out transform",
        isVisible 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95",
        !read && "border-l-4 border-l-primary"
      )}
    >
      {/* Notification Content */}
      <div 
        className="p-4 cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
        onClick={() => onClick(id)}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
            type === 'reaction' 
              ? "bg-red-50 border border-red-100" 
              : type === 'support_ticket'
              ? "bg-green-50 border border-green-100"
              : "bg-blue-50 border border-blue-100"
          )}>
            {getNotificationIcon(type)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm leading-relaxed mb-1",
              !read ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {message}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTimeAgo(createdAt)}</span>
              {!read && (
                <>
                  <span>•</span>
                  <span className="text-primary font-medium">NEW</span>
                </>
              )}
            </div>
          </div>
          
          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(id);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Unread Indicator */}
      {!read && (
        <div className="absolute top-3 left-3 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
};