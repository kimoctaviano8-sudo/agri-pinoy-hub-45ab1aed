-- Add images column to forum_posts table
ALTER TABLE public.forum_posts 
ADD COLUMN images TEXT[];

-- Create comments table for forum posts
CREATE TABLE public.forum_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table for forum posts
CREATE TABLE public.forum_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Everyone can view comments" 
ON public.forum_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.forum_comments 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" 
ON public.forum_comments 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments or admins can delete any" 
ON public.forum_comments 
FOR DELETE 
USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create policies for likes
CREATE POLICY "Everyone can view likes" 
ON public.forum_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create likes" 
ON public.forum_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
ON public.forum_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_forum_comments_updated_at
  BEFORE UPDATE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for forum images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forum-images', 'forum-images', true);

-- Create storage policies for forum images
CREATE POLICY "Users can view forum images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'forum-images');

CREATE POLICY "Users can upload forum images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own forum images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own forum images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);