
-- Table: Track which users have accepted the community EULA
CREATE TABLE public.forum_eula_acceptance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  eula_version text NOT NULL DEFAULT '1.0'
);

ALTER TABLE public.forum_eula_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own EULA acceptance"
ON public.forum_eula_acceptance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own EULA acceptance"
ON public.forum_eula_acceptance FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Table: Content flags / reports from users
CREATE TABLE public.content_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create flags"
ON public.content_flags FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own flags"
ON public.content_flags FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all flags"
ON public.content_flags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Table: User blocks
CREATE TABLE public.user_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_user_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can block others"
ON public.user_blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their own blocks"
ON public.user_blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
ON public.user_blocks FOR DELETE
USING (auth.uid() = blocker_id);

CREATE POLICY "Admins can view all blocks"
ON public.user_blocks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on content_flags
CREATE TRIGGER update_content_flags_updated_at
BEFORE UPDATE ON public.content_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
