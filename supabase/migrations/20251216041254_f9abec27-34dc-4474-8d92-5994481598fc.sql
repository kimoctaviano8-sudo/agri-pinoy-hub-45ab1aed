-- Fix: order_status_bypass - Replace permissive UPDATE policy with restrictive policies

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Policy 1: Allow users to request cancellation only for unpaid orders
CREATE POLICY "Users can request order cancellation"
ON public.orders
FOR UPDATE
USING (
  auth.uid() = user_id AND 
  status = 'to_pay'
)
WITH CHECK (
  auth.uid() = user_id AND
  status = 'pending_cancellation' AND
  cancellation_reason IS NOT NULL AND
  cancellation_requested_at IS NOT NULL
);

-- Policy 2: Allow users to confirm receipt of delivered orders
CREATE POLICY "Users can confirm order receipt"
ON public.orders
FOR UPDATE
USING (
  auth.uid() = user_id AND 
  status = 'to_receive'
)
WITH CHECK (
  auth.uid() = user_id AND
  status = 'completed'
);