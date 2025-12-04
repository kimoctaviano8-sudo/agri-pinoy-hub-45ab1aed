-- Temporarily disable comment notifications by dropping the trigger
-- This removes the automatic notification creation when comments are added

DROP TRIGGER IF EXISTS notify_on_comment ON public.forum_comments;

-- Keep the function for potential future use but don't trigger it automatically
-- The function notify_comment() will remain but won't be called