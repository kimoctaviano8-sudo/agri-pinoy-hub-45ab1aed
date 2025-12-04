-- Create reactions table to replace simple likes
CREATE TABLE public.forum_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji_code text NOT NULL DEFAULT '❤️',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji_code)
);

-- Enable RLS
ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for reactions
CREATE POLICY "Everyone can view reactions" 
ON public.forum_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reactions" 
ON public.forum_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" 
ON public.forum_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions" 
ON public.forum_reactions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create custom emoji sets table
CREATE TABLE public.custom_emoji_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  emojis jsonb NOT NULL DEFAULT '[{"code": "❤️", "label": "heart"}, {"code": "🍃", "label": "leaf"}, {"code": "😮", "label": "wow"}, {"code": "😂", "label": "haha"}, {"code": "😡", "label": "angry"}]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_emoji_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for emoji sets
CREATE POLICY "Everyone can view emoji sets" 
ON public.custom_emoji_sets 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage emoji sets" 
ON public.custom_emoji_sets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default emoji set
INSERT INTO public.custom_emoji_sets (name, emojis, is_default, created_by)
VALUES (
  'Default Reactions',
  '[
    {"code": "❤️", "label": "heart"},
    {"code": "🍃", "label": "leaf"},
    {"code": "😮", "label": "wow"},
    {"code": "😂", "label": "haha"},
    {"code": "😡", "label": "angry"}
  ]'::jsonb,
  true,
  null
);

-- Enable realtime for all forum tables
ALTER TABLE public.forum_posts REPLICA IDENTITY FULL;
ALTER TABLE public.forum_comments REPLICA IDENTITY FULL;
ALTER TABLE public.forum_reactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_reactions;

-- Create updated_at trigger for reactions
CREATE TRIGGER update_forum_reactions_updated_at
  BEFORE UPDATE ON public.forum_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for emoji sets
CREATE TRIGGER update_custom_emoji_sets_updated_at
  BEFORE UPDATE ON public.custom_emoji_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();