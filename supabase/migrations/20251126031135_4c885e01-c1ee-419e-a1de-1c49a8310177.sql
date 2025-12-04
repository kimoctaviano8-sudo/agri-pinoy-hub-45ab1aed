-- Create monthly_sales table for managing recurring monthly sale events
CREATE TABLE IF NOT EXISTS public.monthly_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL, -- e.g., "1.1 New Year Sale", "11.11 Singles Day"
  event_code TEXT NOT NULL UNIQUE, -- e.g., "1.1", "2.2", "11.11"
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  valid_date_start TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_date_end TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monthly_sales ENABLE ROW LEVEL SECURITY;

-- Admins can manage monthly sales
CREATE POLICY "Admins can manage monthly sales"
  ON public.monthly_sales
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view active monthly sales
CREATE POLICY "Everyone can view active monthly sales"
  ON public.monthly_sales
  FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_monthly_sales_updated_at
  BEFORE UPDATE ON public.monthly_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 12 monthly sale events with default dates (current year)
INSERT INTO public.monthly_sales (event_name, event_code, discount_percentage, valid_date_start, valid_date_end, active) VALUES
  ('1.1 New Year Sale', '1.1', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '0 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 days', false),
  ('2.2 February Flash Sale', '2.2', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month 1 day', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month 2 days', false),
  ('3.3 March Madness Sale', '3.3', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '2 months 2 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '2 months 3 days', false),
  ('4.4 April Spring Sale', '4.4', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '3 months 3 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '3 months 4 days', false),
  ('5.5 May Mega Sale', '5.5', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '4 months 4 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '4 months 5 days', false),
  ('6.6 June Super Sale', '6.6', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '5 months 5 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '5 months 6 days', false),
  ('7.7 July Flash Sale', '7.7', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months 6 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months 7 days', false),
  ('8.8 August Blast Sale', '8.8', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '7 months 7 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '7 months 8 days', false),
  ('9.9 September Sale', '9.9', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '8 months 8 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '8 months 9 days', false),
  ('10.10 October Fest Sale', '10.10', 10, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '9 months 9 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '9 months 10 days', false),
  ('11.11 Singles Day Sale', '11.11', 20, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '10 months 10 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '10 months 11 days', false),
  ('12.12 Year End Sale', '12.12', 15, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '11 months 11 days', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '11 months 12 days', false)
ON CONFLICT (event_code) DO NOTHING;