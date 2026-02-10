-- Fix the trigger function to use anon key instead of vault (which may have permission issues)
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
  supabase_url text := 'https://bywimfvrbcjcktqzdvmk.supabase.co';
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'record', jsonb_build_object(
      'id', NEW.id,
      'sender_id', NEW.sender_id,
      'recipient_id', NEW.recipient_id,
      'content', NEW.content,
      'subject', NEW.subject,
      'created_at', NEW.created_at
    )
  );

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5d2ltZnZyYmNqY2t0cXpkdm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjAxNzYsImV4cCI6MjA2ODAzNjE3Nn0.pbscMiJ7N5lBqTsy9vkODlyv0it34dE2m1y4eV6Oclw'
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;