-- Add valid_from field to vouchers table for start date/time
ALTER TABLE public.vouchers
ADD COLUMN valid_from timestamp with time zone DEFAULT now();

-- Update existing vouchers to have a valid_from date (set to created_at)
UPDATE public.vouchers
SET valid_from = created_at
WHERE valid_from IS NULL;