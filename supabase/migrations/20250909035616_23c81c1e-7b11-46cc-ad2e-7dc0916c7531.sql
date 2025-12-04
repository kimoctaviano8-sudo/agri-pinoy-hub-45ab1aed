-- Fix security issue: Restrict access to sensitive profile data

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policies for profiles table
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles for moderation
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create a public_profiles table for safe public access to basic info
CREATE TABLE public.public_profiles (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on public_profiles table
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read public profile info
CREATE POLICY "Everyone can view public profile info"
ON public.public_profiles
FOR SELECT 
USING (true);

-- Only allow system to manage public profiles (via triggers)
CREATE POLICY "System can manage public profiles"
ON public.public_profiles
FOR ALL
USING (false)
WITH CHECK (false);

-- Create trigger function to sync public profile data
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.public_profiles (id, full_name, avatar_url, created_at)
    VALUES (NEW.id, NEW.full_name, NEW.avatar_url, NEW.created_at)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.public_profiles SET
      full_name = NEW.full_name,
      avatar_url = NEW.avatar_url
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to keep public_profiles in sync
CREATE TRIGGER sync_public_profile_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

-- Populate existing data
INSERT INTO public.public_profiles (id, full_name, avatar_url, created_at)
SELECT id, full_name, avatar_url, created_at FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;