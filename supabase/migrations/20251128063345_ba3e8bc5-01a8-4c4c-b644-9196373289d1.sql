-- Make post_id nullable in notifications table to support different notification types
ALTER TABLE public.notifications 
ALTER COLUMN post_id DROP NOT NULL;

-- Add ticket_id column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE;

-- Create index for ticket notifications
CREATE INDEX idx_notifications_ticket_id ON public.notifications(ticket_id);

-- Function to notify field technicians when a ticket is created
CREATE OR REPLACE FUNCTION public.notify_ticket_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  technician_record RECORD;
  user_name text;
BEGIN
  -- Get the user's name
  SELECT COALESCE(full_name, email) INTO user_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Notify all field technicians
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
$$;

-- Function to notify ticket creator when technician responds
CREATE OR REPLACE FUNCTION public.notify_ticket_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_owner_id uuid;
  responder_name text;
  responder_role text;
BEGIN
  -- Get ticket owner
  SELECT user_id INTO ticket_owner_id
  FROM public.support_tickets
  WHERE id = NEW.ticket_id;

  -- Get responder info
  SELECT COALESCE(p.full_name, p.email), COALESCE(p.role, 'user') 
  INTO responder_name, responder_role
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  -- Only notify if responder is a technician and not the ticket owner
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
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_ticket_created ON public.support_tickets;
CREATE TRIGGER trigger_notify_ticket_created
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_created();

DROP TRIGGER IF EXISTS trigger_notify_ticket_response ON public.ticket_responses;
CREATE TRIGGER trigger_notify_ticket_response
  AFTER INSERT ON public.ticket_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_response();