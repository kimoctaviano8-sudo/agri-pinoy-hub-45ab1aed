-- Allow users to delete their own forum posts
CREATE POLICY "Users can delete own posts"
ON public.forum_posts
FOR DELETE
USING (auth.uid() = author_id);
