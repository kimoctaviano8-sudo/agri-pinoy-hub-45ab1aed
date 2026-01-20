-- Create app_settings table for vacation mode and other global settings
CREATE TABLE public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    vacation_mode BOOLEAN NOT NULL DEFAULT false,
    vacation_mode_message TEXT DEFAULT 'Orders are temporarily paused. Please check back later.',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default row
INSERT INTO public.app_settings (id, vacation_mode, vacation_mode_message)
VALUES ('global', false, 'Orders are temporarily paused. Please check back later.');

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read app settings
CREATE POLICY "Anyone can read app settings"
    ON public.app_settings
    FOR SELECT
    USING (true);

-- Only admins can update app settings
CREATE POLICY "Admins can update app settings"
    ON public.app_settings
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_app_settings_timestamp();

-- Enable realtime for app_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;