-- SECURITY FIX: Enhance profiles table security

-- 1. Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    accessor_id UUID NOT NULL,
    accessed_profile_id UUID NOT NULL,
    access_type TEXT NOT NULL,
    accessed_fields TEXT[] NOT NULL,
    access_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS on audit log table
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view access logs"
    ON public.profile_access_logs
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (via trigger/function)
CREATE POLICY "System can insert access logs"
    ON public.profile_access_logs
    FOR INSERT
    WITH CHECK (true);

-- 2. Create a secure view for admin order management with limited fields
-- This prevents admins from accessing full PII when they only need order-related info
CREATE OR REPLACE VIEW public.profiles_order_info AS
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

-- Grant access to the secure view
GRANT SELECT ON public.profiles_order_info TO authenticated;

-- 3. Create a function to log profile access (for admin full access scenarios)
CREATE OR REPLACE FUNCTION public.log_profile_access(
    p_accessed_profile_id UUID,
    p_access_type TEXT,
    p_accessed_fields TEXT[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profile_access_logs (
        accessor_id,
        accessed_profile_id,
        access_type,
        accessed_fields
    ) VALUES (
        auth.uid(),
        p_accessed_profile_id,
        p_access_type,
        p_accessed_fields
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_profile_access(UUID, TEXT, TEXT[]) TO authenticated;

-- 4. Add index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessor 
    ON public.profile_access_logs(accessor_id);
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessed 
    ON public.profile_access_logs(accessed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_timestamp 
    ON public.profile_access_logs(access_timestamp DESC);