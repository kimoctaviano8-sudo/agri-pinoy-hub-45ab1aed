-- Create trigger function to send push notification on new ticket response
CREATE OR REPLACE FUNCTION public.notify_ticket_response_push()
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
    'notification_type', 'ticket_response',
    'type', 'INSERT',
    'record', jsonb_build_object(
      'id', NEW.id,
      'ticket_id', NEW.ticket_id,
      'user_id', NEW.user_id,
      'message', NEW.message,
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

-- Create trigger on ticket_responses table
CREATE TRIGGER on_ticket_response_push_notification
AFTER INSERT ON public.ticket_responses
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_response_push();
