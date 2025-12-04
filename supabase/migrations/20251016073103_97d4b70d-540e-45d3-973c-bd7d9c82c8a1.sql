-- Create user_achievements table to track individual achievement progress
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  earned BOOLEAN NOT NULL DEFAULT false,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 100,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  earned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
ON public.user_achievements
FOR UPDATE
USING (auth.uid() = user_id);

-- Create user_points table to track total points
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  points_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own points"
ON public.user_points
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
ON public.user_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
ON public.user_points
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to initialize default achievements for a user
CREATE OR REPLACE FUNCTION public.initialize_user_achievements(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Scanner achievements
  INSERT INTO public.user_achievements (user_id, achievement_id, title, description, icon, points, target, category, rarity)
  VALUES 
    (user_id_param, 'first_scan', 'First Scan', 'Complete your first plant scan', '🔍', 10, 1, 'Scanner', 'common'),
    (user_id_param, 'scan_5', 'Scanner Novice', 'Complete 5 plant scans', '🌱', 25, 5, 'Scanner', 'common'),
    (user_id_param, 'scan_25', 'Scanner Expert', 'Complete 25 plant scans', '🌿', 100, 25, 'Scanner', 'rare'),
    (user_id_param, 'scan_100', 'Master Diagnostician', 'Complete 100 plant scans', '🏆', 500, 100, 'Scanner', 'legendary'),
    (user_id_param, 'streak_7', 'Week Warrior', 'Login 7 days in a row', '🔥', 50, 7, 'Engagement', 'uncommon'),
    (user_id_param, 'perfect_diagnosis', 'Perfect Diagnosis', 'Get a 95%+ confidence scan', '💯', 50, 1, 'Scanner', 'rare')
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION public.update_achievement_progress(
  user_id_param UUID,
  achievement_id_param TEXT,
  progress_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  achievement_record RECORD;
  points_awarded INTEGER := 0;
  achievement_earned BOOLEAN := false;
BEGIN
  -- Initialize achievements if they don't exist
  PERFORM public.initialize_user_achievements(user_id_param);
  
  -- Initialize points if they don't exist
  INSERT INTO public.user_points (user_id, total_points, available_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current achievement
  SELECT * INTO achievement_record
  FROM public.user_achievements
  WHERE user_id = user_id_param
    AND achievement_id = achievement_id_param;
  
  -- Update progress
  IF achievement_record.earned = false THEN
    UPDATE public.user_achievements
    SET 
      progress = LEAST(progress + progress_increment, target),
      earned = (progress + progress_increment >= target),
      earned_at = CASE WHEN (progress + progress_increment >= target) THEN now() ELSE NULL END,
      updated_at = now()
    WHERE user_id = user_id_param
      AND achievement_id = achievement_id_param
    RETURNING earned, points INTO achievement_earned, points_awarded;
    
    -- Award points if achievement was just earned
    IF achievement_earned THEN
      UPDATE public.user_points
      SET 
        total_points = total_points + points_awarded,
        available_points = available_points + points_awarded,
        updated_at = now()
      WHERE user_id = user_id_param;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'earned', achievement_earned,
    'points_awarded', CASE WHEN achievement_earned THEN points_awarded ELSE 0 END
  );
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();