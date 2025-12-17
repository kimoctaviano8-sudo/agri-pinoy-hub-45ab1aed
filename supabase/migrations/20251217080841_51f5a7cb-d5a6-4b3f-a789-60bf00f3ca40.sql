-- Create fees table for configurable fees like shipping
CREATE TABLE public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type text NOT NULL UNIQUE,
  fee_name text NOT NULL,
  fee_value numeric NOT NULL DEFAULT 0,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active fees
CREATE POLICY "Everyone can view active fees"
ON public.fees
FOR SELECT
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage fees
CREATE POLICY "Admins can manage fees"
ON public.fees
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_fees_updated_at
  BEFORE UPDATE ON public.fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shipping fee
INSERT INTO public.fees (fee_type, fee_name, fee_value, description, active)
VALUES ('shipping', 'Shipping Fee', 50, 'Standard shipping fee for all orders', true);