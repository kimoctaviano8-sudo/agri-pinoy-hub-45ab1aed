-- Create user_credits table to track scanning credits
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 10,
  total_credits_purchased INTEGER NOT NULL DEFAULT 0,
  last_scan_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create policies for user credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits for new users"
  ON public.user_credits
  FOR INSERT
  WITH CHECK (true);

-- Create function to initialize user credits
CREATE OR REPLACE FUNCTION public.initialize_user_credits(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (user_id_param, 10)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Create function to consume a credit
CREATE OR REPLACE FUNCTION public.consume_credit(user_id_param UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Initialize credits if user doesn't have a record
  PERFORM public.initialize_user_credits(user_id_param);
  
  -- Get current credits
  SELECT credits_remaining INTO current_credits
  FROM public.user_credits
  WHERE user_id = user_id_param;
  
  -- Check if user has credits
  IF current_credits <= 0 THEN
    RETURN false;
  END IF;
  
  -- Consume a credit
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining - 1,
    last_scan_date = now(),
    updated_at = now()
  WHERE user_id = user_id_param;
  
  RETURN true;
END;
$$;

-- Create function to add credits (for purchases)
CREATE OR REPLACE FUNCTION public.add_credits(user_id_param UUID, credits_to_add INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize credits if user doesn't have a record
  PERFORM public.initialize_user_credits(user_id_param);
  
  -- Add credits
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining + credits_to_add,
    total_credits_purchased = total_credits_purchased + credits_to_add,
    updated_at = now()
  WHERE user_id = user_id_param;
END;
$$;

-- Create updated_at trigger
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();