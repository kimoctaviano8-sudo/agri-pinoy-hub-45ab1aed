-- Create a function to call the send-push-notification edge function via pg_net
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
  supabase_url text := 'https://bywimfvrbcjcktqzdvmk.supabase.co';
  service_role_key text;
BEGIN
  -- Build the payload matching what the edge function expects
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

  -- Call the edge function using pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;

-- Create trigger on messages table
CREATE TRIGGER on_new_message_push_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();
