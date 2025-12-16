-- Fix 1: Add search_path protection to all SECURITY DEFINER functions

-- has_role() - Critical for authorization
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- update_login_streak()
CREATE OR REPLACE FUNCTION public.update_login_streak(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  streak_record RECORD;
  new_streak INTEGER := 1;
  voucher_earned BOOLEAN := FALSE;
BEGIN
  SELECT * INTO streak_record 
  FROM public.user_streaks 
  WHERE user_streaks.user_id = update_login_streak.user_id;
  
  IF streak_record IS NULL THEN
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
    IF streak_record.last_login_date = current_date THEN
      RETURN;
    END IF;
    
    IF streak_record.last_login_date = yesterday_date THEN
      new_streak := streak_record.current_streak + 1;
    ELSE
      new_streak := 1;
    END IF;
    
    IF new_streak % 7 = 0 THEN
      voucher_earned := TRUE;
    END IF;
    
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
$function$;

-- initialize_user_credits()
CREATE OR REPLACE FUNCTION public.initialize_user_credits(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (user_id_param, 100)
  ON CONFLICT (user_id) DO NOTHING;
END;
$function$;

-- consume_credit()
CREATE OR REPLACE FUNCTION public.consume_credit(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_credits INTEGER;
BEGIN
  PERFORM public.initialize_user_credits(user_id_param);
  
  SELECT credits_remaining INTO current_credits
  FROM public.user_credits
  WHERE user_id = user_id_param;
  
  IF current_credits <= 0 THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining - 1,
    last_scan_date = now(),
    updated_at = now()
  WHERE user_id = user_id_param;
  
  RETURN true;
END;
$function$;

-- add_credits()
CREATE OR REPLACE FUNCTION public.add_credits(user_id_param uuid, credits_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.initialize_user_credits(user_id_param);
  
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining + credits_to_add,
    total_credits_purchased = total_credits_purchased + credits_to_add,
    updated_at = now()
  WHERE user_id = user_id_param;
END;
$function$;

-- create_notification()
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_post_id uuid, p_actor_id uuid, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF p_user_id = p_actor_id THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, type, post_id, actor_id, message)
  VALUES (p_user_id, p_type, p_post_id, p_actor_id, p_message);
END;
$function$;

-- notify_reaction()
CREATE OR REPLACE FUNCTION public.notify_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_author_id uuid;
  actor_name text;
BEGIN
  SELECT author_id INTO post_author_id
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  SELECT COALESCE(full_name, email) INTO actor_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  PERFORM public.create_notification(
    post_author_id,
    'reaction',
    NEW.post_id,
    NEW.user_id,
    actor_name || ' reacted ' || NEW.emoji_code || ' to your post'
  );

  RETURN NEW;
END;
$function$;

-- notify_comment()
CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_author_id uuid;
  parent_comment_author_id uuid;
  actor_name text;
BEGIN
  SELECT COALESCE(full_name, email) INTO actor_name
  FROM public.profiles
  WHERE id = NEW.author_id;

  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT author_id INTO parent_comment_author_id
    FROM public.forum_comments
    WHERE id = NEW.parent_comment_id;
    
    PERFORM public.create_notification(
      parent_comment_author_id,
      'comment',
      NEW.post_id,
      NEW.author_id,
      actor_name || ' replied to your comment'
    );
  ELSE
    SELECT author_id INTO post_author_id
    FROM public.forum_posts
    WHERE id = NEW.post_id;

    PERFORM public.create_notification(
      post_author_id,
      'comment',
      NEW.post_id,
      NEW.author_id,
      actor_name || ' commented on your post'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- initialize_user_achievements()
CREATE OR REPLACE FUNCTION public.initialize_user_achievements(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
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
$function$;

-- update_achievement_progress()
CREATE OR REPLACE FUNCTION public.update_achievement_progress(user_id_param uuid, achievement_id_param text, progress_increment integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  achievement_record RECORD;
  points_awarded INTEGER := 0;
  achievement_earned BOOLEAN := false;
BEGIN
  PERFORM public.initialize_user_achievements(user_id_param);
  
  INSERT INTO public.user_points (user_id, total_points, available_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO achievement_record
  FROM public.user_achievements
  WHERE user_id = user_id_param
    AND achievement_id = achievement_id_param;
  
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
$function$;

-- get_nearby_disease_reports()
CREATE OR REPLACE FUNCTION public.get_nearby_disease_reports(user_lat numeric, user_lng numeric, radius_km integer DEFAULT 50)
RETURNS TABLE(id uuid, disease_type text, severity_level text, crop_type text, location_name text, distance_km numeric, created_at timestamp with time zone, report_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    dr.id,
    dr.disease_type,
    dr.severity_level,
    dr.crop_type,
    dr.location_name,
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(dr.location_latitude)) * 
        cos(radians(dr.location_longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(dr.location_latitude))
      )
    )::DECIMAL as distance_km,
    dr.created_at,
    COUNT(*) OVER (PARTITION BY dr.disease_type, dr.crop_type) as report_count
  FROM public.disease_reports dr
  WHERE dr.verified = true
    AND dr.location_latitude IS NOT NULL 
    AND dr.location_longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(dr.location_latitude)) * 
        cos(radians(dr.location_longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(dr.location_latitude))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
$function$;

-- get_unread_notification_count()
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::integer
  FROM public.notifications
  WHERE notifications.user_id = get_unread_notification_count.user_id
  AND read = false;
$function$;

-- cleanup_old_scan_history()
CREATE OR REPLACE FUNCTION public.cleanup_old_scan_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.plant_scan_history
  WHERE scan_date < NOW() - INTERVAL '24 hours';
END;
$function$;

-- trigger_cleanup_scan_history()
CREATE OR REPLACE FUNCTION public.trigger_cleanup_scan_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.cleanup_old_scan_history();
  RETURN NEW;
END;
$function$;

-- sync_public_profile()
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.public_profiles (id, full_name, avatar_url, created_at)
    VALUES (NEW.id, NEW.full_name, NEW.avatar_url, NEW.created_at)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.public_profiles SET
      full_name = NEW.full_name,
      avatar_url = NEW.avatar_url
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- notify_ticket_created()
CREATE OR REPLACE FUNCTION public.notify_ticket_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  technician_record RECORD;
  user_name text;
BEGIN
  SELECT COALESCE(full_name, email) INTO user_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  FOR technician_record IN 
    SELECT DISTINCT user_id 
    FROM public.user_roles 
    WHERE role = 'field_technician'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      ticket_id,
      actor_id,
      message,
      read
    ) VALUES (
      technician_record.user_id,
      'support_ticket',
      NEW.id,
      NEW.user_id,
      user_name || ' submitted a support ticket: ' || NEW.subject,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- notify_ticket_response()
CREATE OR REPLACE FUNCTION public.notify_ticket_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  ticket_owner_id uuid;
  responder_name text;
  responder_role text;
BEGIN
  SELECT user_id INTO ticket_owner_id
  FROM public.support_tickets
  WHERE id = NEW.ticket_id;

  SELECT COALESCE(p.full_name, p.email), COALESCE(p.role, 'user') 
  INTO responder_name, responder_role
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  IF responder_role = 'field_technician' AND NEW.user_id != ticket_owner_id THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      ticket_id,
      actor_id,
      message,
      read
    ) VALUES (
      ticket_owner_id,
      'support_ticket',
      NEW.ticket_id,
      NEW.user_id,
      responder_name || ' responded to your support ticket',
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix 2: Restrict notification INSERT policy - Block direct inserts, only allow via triggers
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a restrictive policy that only allows INSERT from within database functions/triggers
-- This effectively blocks direct client inserts while allowing trigger-based inserts
CREATE POLICY "Only system triggers can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (false);

-- Fix 3: Add server-side profanity filter for forum posts
CREATE OR REPLACE FUNCTION public.check_profanity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  profane_word RECORD;
  check_text TEXT;
  flagged_words TEXT[] := '{}';
BEGIN
  -- Combine title and content for checking
  check_text := LOWER(NEW.title || ' ' || NEW.content);
  
  -- Check against profanity words table
  FOR profane_word IN 
    SELECT word, severity FROM public.profanity_words
  LOOP
    IF check_text ~* ('\m' || profane_word.word || '\M') THEN
      flagged_words := array_append(flagged_words, profane_word.word);
    END IF;
  END LOOP;
  
  -- If profanity found, set flagged_content and moderation_status
  IF array_length(flagged_words, 1) > 0 THEN
    NEW.flagged_content := flagged_words;
    NEW.moderation_status := 'pending';
    NEW.published := false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for forum posts profanity check
DROP TRIGGER IF EXISTS check_forum_post_profanity ON public.forum_posts;
CREATE TRIGGER check_forum_post_profanity
  BEFORE INSERT OR UPDATE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profanity();