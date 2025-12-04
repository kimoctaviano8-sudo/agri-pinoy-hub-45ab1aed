-- Create promotional_carousel table for managing hero carousel images
CREATE TABLE public.promotional_carousel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.promotional_carousel ENABLE ROW LEVEL SECURITY;

-- Everyone can view active carousel items
CREATE POLICY "Everyone can view active carousel items"
ON public.promotional_carousel
FOR SELECT
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage carousel
CREATE POLICY "Admins can manage carousel"
ON public.promotional_carousel
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for ordering
CREATE INDEX idx_promotional_carousel_order ON public.promotional_carousel(display_order, active);

-- Trigger for updated_at
CREATE TRIGGER update_promotional_carousel_updated_at
BEFORE UPDATE ON public.promotional_carousel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default carousel items
INSERT INTO public.promotional_carousel (image_url, title, subtitle, display_order, active)
VALUES 
  ('https://bywimfvrbcjcktqzdvmk.supabase.co/storage/v1/object/public/products/hero-agriculture.jpg', 'Welcome To Gemini', 'Latest news and insights for Filipino farmers', 1, true);