-- Add DELETE policy for plant_scan_history
CREATE POLICY "Users can delete their own scan history" 
ON public.plant_scan_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to clean up old scan history (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_scan_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.plant_scan_history
  WHERE scan_date < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create a trigger to automatically clean up old records when new ones are inserted
CREATE OR REPLACE FUNCTION public.trigger_cleanup_scan_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up old records when new scan is added
  PERFORM public.cleanup_old_scan_history();
  RETURN NEW;
END;
$$;

-- Create trigger on insert
CREATE TRIGGER cleanup_scan_history_trigger
  AFTER INSERT ON public.plant_scan_history
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cleanup_scan_history();