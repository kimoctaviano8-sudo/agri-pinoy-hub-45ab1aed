
-- Create dealers table
CREATE TABLE public.dealers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  region text NOT NULL,
  phone text NOT NULL,
  hours text NOT NULL DEFAULT 'Mon-Sat: 8AM-5PM',
  latitude numeric NULL,
  longitude numeric NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active dealers
CREATE POLICY "Everyone can view active dealers"
ON public.dealers
FOR SELECT
USING ((active = true) OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage dealers
CREATE POLICY "Admins can manage dealers"
ON public.dealers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_dealers_updated_at
BEFORE UPDATE ON public.dealers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing hardcoded dealers
INSERT INTO public.dealers (name, address, city, province, region, phone, hours, latitude, longitude) VALUES
  ('Gemini Agri Supply - Laguna Main', '123 National Highway, Brgy. San Antonio', 'Santa Cruz', 'Laguna', 'Region IV-A (CALABARZON)', '0999 885 2599', 'Mon-Sat: 8AM-5PM', 14.2820, 121.4150),
  ('Gemini Agri Supply - Batangas Branch', '456 Rizal Avenue, Brgy. Poblacion', 'Lipa', 'Batangas', 'Region IV-A (CALABARZON)', '0998 985 3740', 'Mon-Sat: 8AM-5PM', 13.9411, 121.1632),
  ('Gemini Agri Supply - Albay Branch', '789 Peñaranda St., Brgy. Tagas', 'Legazpi', 'Albay', 'Region V (Bicol)', '0998 954 5137', 'Mon-Sat: 8AM-5PM', 13.1391, 123.7438),
  ('Gemini Agri Supply - Quezon Branch', '321 Maharlika Highway, Brgy. Ibabang Dupay', 'Lucena', 'Quezon', 'Region IV-A (CALABARZON)', '0917 123 4567', 'Mon-Sat: 8AM-5PM', 13.9373, 121.6170),
  ('Gemini Agri Supply - Camarines Sur', '555 Panganiban Drive, Brgy. San Francisco', 'Naga', 'Camarines Sur', 'Region V (Bicol)', '0918 234 5678', 'Mon-Sat: 8AM-5PM', 13.6218, 123.1948),
  ('Gemini Agri Supply - Cavite Branch', '888 Aguinaldo Highway, Brgy. Salitran', 'Dasmariñas', 'Cavite', 'Region IV-A (CALABARZON)', '0919 345 6789', 'Mon-Sat: 8AM-5PM', 14.3294, 120.9367);
