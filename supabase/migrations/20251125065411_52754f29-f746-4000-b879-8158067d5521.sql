-- Create sales_reports table to store saved order analytics
CREATE TABLE public.sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_sales NUMERIC NOT NULL,
  total_orders INTEGER NOT NULL,
  total_products_ordered INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_reports ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sales reports
CREATE POLICY "Admins can manage sales reports"
ON public.sales_reports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_sales_reports_updated_at
BEFORE UPDATE ON public.sales_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();