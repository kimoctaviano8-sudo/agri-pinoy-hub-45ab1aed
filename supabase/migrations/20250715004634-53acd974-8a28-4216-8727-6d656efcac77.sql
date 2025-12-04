-- Add moderation fields to forum_posts table
ALTER TABLE public.forum_posts 
ADD COLUMN moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN flagged_content TEXT[], 
ADD COLUMN moderated_by UUID,
ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policy to hide pending/rejected posts from regular users
DROP POLICY IF EXISTS "Everyone can view published forum posts" ON public.forum_posts;

CREATE POLICY "Everyone can view approved published forum posts" 
ON public.forum_posts 
FOR SELECT 
USING (
  (published = true AND moderation_status = 'approved') 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = author_id
);

-- Add index for moderation queries
CREATE INDEX idx_forum_posts_moderation_status ON public.forum_posts(moderation_status) WHERE moderation_status != 'approved';