-- Create user_streaks table to track daily login streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  total_logins INTEGER NOT NULL DEFAULT 0,
  vouchers_earned INTEGER NOT NULL DEFAULT 0,
  streak_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own streaks" 
ON public.user_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" 
ON public.user_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
ON public.user_streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update login streak
CREATE OR REPLACE FUNCTION public.update_login_streak(user_id UUID)
RETURNS VOID AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  streak_record RECORD;
  new_streak INTEGER := 1;
  voucher_earned BOOLEAN := FALSE;
BEGIN
  -- Get or create streak record for user
  SELECT * INTO streak_record 
  FROM public.user_streaks 
  WHERE user_streaks.user_id = update_login_streak.user_id;
  
  IF streak_record IS NULL THEN
    -- Create new streak record
    INSERT INTO public.user_streaks (
      user_id, 
      current_streak, 
      longest_streak, 
      last_login_date, 
      total_logins,
      streak_start_date
    ) VALUES (
      update_login_streak.user_id, 
      1, 
      1, 
      current_date, 
      1,
      current_date
    );
  ELSE
    -- Don't update if already logged in today
    IF streak_record.last_login_date = current_date THEN
      RETURN;
    END IF;
    
    -- Calculate new streak
    IF streak_record.last_login_date = yesterday_date THEN
      -- Consecutive day, increment streak
      new_streak := streak_record.current_streak + 1;
    ELSE
      -- Break in streak, reset to 1
      new_streak := 1;
    END IF;
    
    -- Check if user earned a voucher (every 7 days)
    IF new_streak % 7 = 0 THEN
      voucher_earned := TRUE;
    END IF;
    
    -- Update streak record
    UPDATE public.user_streaks SET
      current_streak = new_streak,
      longest_streak = GREATEST(longest_streak, new_streak),
      last_login_date = current_date,
      total_logins = total_logins + 1,
      vouchers_earned = CASE WHEN voucher_earned THEN vouchers_earned + 1 ELSE vouchers_earned END,
      streak_start_date = CASE WHEN new_streak = 1 THEN current_date ELSE streak_start_date END,
      updated_at = now()
    WHERE user_streaks.user_id = update_login_streak.user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_user_streaks_last_login ON public.user_streaks(last_login_date);