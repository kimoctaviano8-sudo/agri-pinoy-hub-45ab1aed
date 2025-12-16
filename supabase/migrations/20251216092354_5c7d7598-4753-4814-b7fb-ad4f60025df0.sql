-- Create discount_rules table for automatic offers
CREATE TABLE public.discount_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL CHECK (rule_type IN ('free_shipping', 'free_product')),
  min_quantity integer NOT NULL DEFAULT 1,
  free_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  free_product_quantity integer DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;

-- Everyone can view active discount rules
CREATE POLICY "Everyone can view active discount rules"
ON public.discount_rules
FOR SELECT
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage discount rules
CREATE POLICY "Admins can manage discount rules"
ON public.discount_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default discount rules
INSERT INTO public.discount_rules (name, description, rule_type, min_quantity, priority, active)
VALUES 
  ('Buy 3 Get Free Shipping', 'Purchase 3 or more items to get free shipping on your order', 'free_shipping', 3, 1, true);

-- Note: The "Buy 12 Get 1 Free Foliar" rule needs to reference an actual product
-- It will be configured by admin after selecting a foliar product