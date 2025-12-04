-- Update default credits from 10 to 100
ALTER TABLE public.user_credits 
ALTER COLUMN credits_remaining SET DEFAULT 100;

-- Update the initialize_user_credits function to use 100 credits
CREATE OR REPLACE FUNCTION public.initialize_user_credits(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (user_id_param, 100)
  ON CONFLICT (user_id) DO NOTHING;
END;
$function$;