-- FIX SECURITY ISSUES from previous migration

-- 1. Fix the SECURITY DEFINER view issue by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_order_info;

CREATE VIEW public.profiles_order_info 
WITH (security_invoker = true)
AS
SELECT 
    id,
    full_name,
    -- Mask email to show only first 3 chars + domain hint
    CASE 
        WHEN email IS NOT NULL AND LENGTH(email) > 3 
        THEN LEFT(email, 3) || '***@***' || SUBSTRING(email FROM POSITION('@' IN email) + 1 FOR 3) || '...'
        ELSE NULL
    END as masked_email,
    -- Mask phone to show only last 4 digits
    CASE 
        WHEN phone IS NOT NULL AND LENGTH(phone) > 4 
        THEN '****' || RIGHT(phone, 4)
        ELSE NULL
    END as masked_phone
FROM public.profiles;

-- Re-grant access to the secure view
GRANT SELECT ON public.profiles_order_info TO authenticated;

-- 2. Fix the overly permissive INSERT policy on profile_access_logs
-- Drop the permissive policy
DROP POLICY IF EXISTS "System can insert access logs" ON public.profile_access_logs;

-- Create a more restrictive policy - only authenticated users can log their own access
CREATE POLICY "Authenticated users can insert access logs"
    ON public.profile_access_logs
    FOR INSERT
    WITH CHECK (auth.uid() = accessor_id);