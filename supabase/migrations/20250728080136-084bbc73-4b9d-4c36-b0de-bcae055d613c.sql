-- Create table for plant scan history
CREATE TABLE public.plant_scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  disease_detected TEXT,
  confidence_score NUMERIC,
  recommendations TEXT,
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.plant_scan_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scan history" 
ON public.plant_scan_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scan history" 
ON public.plant_scan_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_plant_scan_history_updated_at
BEFORE UPDATE ON public.plant_scan_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();