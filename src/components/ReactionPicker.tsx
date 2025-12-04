import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Emoji {
  code: string;
  label: string;
}

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void;
  userReactions: string[];
  postId: string;
  reactionCount: number;
  hasReacted: boolean;
}

export const ReactionPicker = ({ onReactionSelect, userReactions, postId, reactionCount, hasReacted }: ReactionPickerProps) => {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmojiSet();
  }, []);

  const fetchEmojiSet = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_emoji_sets')
        .select('emojis')
        .eq('is_default', true)
        .single();

      if (error) throw error;

      if (data?.emojis) {
        setEmojis(Array.isArray(data.emojis) ? (data.emojis as unknown) as Emoji[] : []);
      }
    } catch (error) {
      console.error('Error fetching emoji set:', error);
      // Fallback to default emojis
      setEmojis([
        { code: '❤️', label: 'heart' },
        { code: '🍃', label: 'leaf' },
        { code: '😮', label: 'wow' },
        { code: '😂', label: 'haha' },
        { code: '😡', label: 'angry' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center space-x-2 h-8 px-2 transition-all duration-200 hover:scale-105 ${
            hasReacted 
              ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30' 
              : 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
          }`}
        >
          <Heart className={`w-4 h-4 ${hasReacted ? 'fill-current' : ''}`} />
          <span className="text-sm">{reactionCount}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg rounded-full" side="top">
        <div className="flex gap-1 px-2 py-1">
          {loading ? (
            <div className="flex items-center justify-center p-2">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            emojis.map((emoji) => (
              <Button
                key={emoji.code}
                variant="ghost"
                size="sm"
                className={`h-10 w-10 p-0 rounded-full text-xl hover:scale-125 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 ${
                  userReactions.includes(emoji.code) 
                    ? 'scale-110 bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500/30' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => onReactionSelect(emoji.code)}
                title={emoji.label}
              >
                {emoji.code}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};