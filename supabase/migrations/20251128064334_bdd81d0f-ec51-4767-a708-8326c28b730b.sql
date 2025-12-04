-- Enable full replica identity for realtime updates
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_responses REPLICA IDENTITY FULL;

-- Ensure ticket_responses is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'ticket_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_responses;
  END IF;
END $$;
