-- Fix profanity_words RLS policy to allow everyone to read profanity words
-- for content filtering, while keeping admin-only management

-- Drop the existing policy
DROP POLICY IF EXISTS "Only admins can manage profanity words" ON public.profanity_words;

-- Create separate policies for read and write operations
CREATE POLICY "Everyone can read profanity words for filtering"
ON public.profanity_words
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage profanity words"
ON public.profanity_words
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));