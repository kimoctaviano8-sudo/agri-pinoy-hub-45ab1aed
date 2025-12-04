-- Create disease_reports table for community reporting
CREATE TABLE public.disease_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  disease_type TEXT NOT NULL,
  severity_level TEXT NOT NULL CHECK (severity_level IN ('mild', 'moderate', 'severe')),
  crop_type TEXT NOT NULL,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_name TEXT,
  anonymous BOOLEAN NOT NULL DEFAULT true,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disease_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for disease_reports
CREATE POLICY "Everyone can view verified reports" 
ON public.disease_reports 
FOR SELECT 
USING (verified = true);

CREATE POLICY "Users can create reports" 
ON public.disease_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.disease_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can verify reports" 
ON public.disease_reports 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create outbreak_predictions table for AI predictions
CREATE TABLE public.outbreak_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  disease_type TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  region TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  confidence_score DECIMAL(3, 2),
  predicted_start_date DATE,
  predicted_peak_date DATE,
  weather_factors JSONB,
  historical_data JSONB,
  prevention_tips TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outbreak_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy for outbreak_predictions
CREATE POLICY "Everyone can view active predictions" 
ON public.outbreak_predictions 
FOR SELECT 
USING (active = true);

-- Create function to get nearby disease reports
CREATE OR REPLACE FUNCTION public.get_nearby_disease_reports(
  user_lat DECIMAL(10, 8),
  user_lng DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  disease_type TEXT,
  severity_level TEXT,
  crop_type TEXT,
  location_name TEXT,
  distance_km DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  report_count BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    dr.id,
    dr.disease_type,
    dr.severity_level,
    dr.crop_type,
    dr.location_name,
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(dr.location_latitude)) * 
        cos(radians(dr.location_longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(dr.location_latitude))
      )
    )::DECIMAL as distance_km,
    dr.created_at,
    COUNT(*) OVER (PARTITION BY dr.disease_type, dr.crop_type) as report_count
  FROM public.disease_reports dr
  WHERE dr.verified = true
    AND dr.location_latitude IS NOT NULL 
    AND dr.location_longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(dr.location_latitude)) * 
        cos(radians(dr.location_longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(dr.location_latitude))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
$$;