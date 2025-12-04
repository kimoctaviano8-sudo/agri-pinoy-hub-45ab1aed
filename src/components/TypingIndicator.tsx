import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TypingIndicatorProps {
  postId: string;
  currentUserId: string;
  isAuthor: boolean;
}

export const TypingIndicator = ({ postId, currentUserId, isAuthor }: TypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthor) return;

    const channel = supabase.channel(`typing:${postId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users = Object.keys(presenceState).filter(userId => {
          const userPresence = presenceState[userId]?.[0] as any;
          return userId !== currentUserId && userPresence?.typing === true;
        });
        setTypingUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences?.[0] as any;
        if (key !== currentUserId && presence?.typing === true) {
          setTypingUsers(prev => [...new Set([...prev, key])]);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setTypingUsers(prev => prev.filter(userId => userId !== key));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, currentUserId, isAuthor]);

  if (!isAuthor || typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-xs text-muted-foreground">
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {typingUsers.length === 1 
          ? "Someone is typing..." 
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </div>
  );
};