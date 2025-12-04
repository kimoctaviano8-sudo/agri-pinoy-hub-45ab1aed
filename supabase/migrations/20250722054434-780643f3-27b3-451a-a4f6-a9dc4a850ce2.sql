-- Create notifications table for forum activity
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('reaction', 'comment')),
  post_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_post_id uuid,
  p_actor_id uuid,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Don't create notification if user is acting on their own post
  IF p_user_id = p_actor_id THEN
    RETURN;
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (user_id, type, post_id, actor_id, message)
  VALUES (p_user_id, p_type, p_post_id, p_actor_id, p_message);
END;
$$;

-- Create trigger function for reactions
CREATE OR REPLACE FUNCTION public.notify_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_author_id uuid;
  actor_name text;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author_id
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  -- Get actor name
  SELECT COALESCE(full_name, email) INTO actor_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notification
  PERFORM public.create_notification(
    post_author_id,
    'reaction',
    NEW.post_id,
    NEW.user_id,
    actor_name || ' reacted ' || NEW.emoji_code || ' to your post'
  );

  RETURN NEW;
END;
$$;

-- Create trigger function for comments
CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_author_id uuid;
  actor_name text;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author_id
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  -- Get actor name
  SELECT COALESCE(full_name, email) INTO actor_name
  FROM public.profiles
  WHERE id = NEW.author_id;

  -- Create notification
  PERFORM public.create_notification(
    post_author_id,
    'comment',
    NEW.post_id,
    NEW.author_id,
    actor_name || ' commented on your post'
  );

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER notify_on_reaction
  AFTER INSERT ON public.forum_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reaction();

CREATE TRIGGER notify_on_comment
  AFTER INSERT ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment();