-- Add show_carousel column to app_settings table
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS show_carousel BOOLEAN DEFAULT true;