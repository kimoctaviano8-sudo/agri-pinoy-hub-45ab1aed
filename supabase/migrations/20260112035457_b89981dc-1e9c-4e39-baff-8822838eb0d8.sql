-- SECURITY FIX: Revoke public access to add_credits function
-- This function should only be callable by service_role (for webhook use)

-- Remove all existing permissions from add_credits
REVOKE ALL ON FUNCTION public.add_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_credits(UUID, INTEGER) FROM authenticated;
REVOKE ALL ON FUNCTION public.add_credits(UUID, INTEGER) FROM anon;

-- Grant execute permission only to service_role (used by webhooks with service_role key)
GRANT EXECUTE ON FUNCTION public.add_credits(UUID, INTEGER) TO service_role;