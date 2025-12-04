-- Fix the forum_posts table author_id column to be non-nullable
-- and ensure the RLS policy works correctly

-- First, update any existing posts with null author_id (if any)
UPDATE public.forum_posts 
SET author_id = (
    SELECT id FROM auth.users LIMIT 1
) 
WHERE author_id IS NULL;

-- Now make author_id NOT NULL
ALTER TABLE public.forum_posts 
ALTER COLUMN author_id SET NOT NULL;

-- Update the RLS policy to be more explicit
DROP POLICY IF EXISTS "Users can create forum posts" ON public.forum_posts;

CREATE POLICY "Users can create forum posts" 
ON public.forum_posts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);