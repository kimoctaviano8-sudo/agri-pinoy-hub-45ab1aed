import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseTypingIndicatorProps {
  postId: string;
  currentUserId: string;
  isTyping: boolean;
}

export const useTypingIndicator = ({ postId, currentUserId, isTyping }: UseTypingIndicatorProps) => {
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel(`typing:${postId}`);

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;

      if (isTyping) {
        await channel.track({
          user_id: currentUserId,
          typing: true,
          timestamp: Date.now()
        });
      } else {
        await channel.untrack();
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [postId, currentUserId, isTyping]);
};