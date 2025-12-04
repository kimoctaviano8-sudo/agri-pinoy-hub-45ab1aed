-- Add cancellation-related columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_details TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_approved_by UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_approved_at TIMESTAMP WITH TIME ZONE;

-- Add new status values for pending cancellation
-- Note: We'll handle the status as text, including 'pending_cancellation'