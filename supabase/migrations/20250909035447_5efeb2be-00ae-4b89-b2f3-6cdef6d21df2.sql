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

-- Create a public_profiles view for safe public access to basic info
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Allow everyone to read from the public view
CREATE POLICY "Everyone can view public profile info"
ON public.public_profiles
FOR SELECT 
USING (true);

-- Enable RLS on the view (required for policies)
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create a function to get public profile info (for easier use in code)
CREATE OR REPLACE FUNCTION public.get_public_profile(user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id, full_name, avatar_url, created_at
  FROM public.profiles
  WHERE profiles.id = user_id;
$$;