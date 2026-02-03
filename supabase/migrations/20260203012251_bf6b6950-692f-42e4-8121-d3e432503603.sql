-- Fix overly permissive INSERT policy on user_credits table
-- The current policy allows anyone to insert records, which should be restricted

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "System can insert credits for new users" ON public.user_credits;

-- Create a proper policy that allows authenticated users to insert only their own credits record
-- This is typically done by SECURITY DEFINER functions (initialize_user_credits, add_credits)
-- but we need to allow direct inserts for the user's own record as well
CREATE POLICY "Users can insert their own credits" 
ON public.user_credits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);