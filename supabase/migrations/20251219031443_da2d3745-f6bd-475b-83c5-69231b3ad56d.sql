-- Add published_date column to news table
ALTER TABLE public.news 
ADD COLUMN published_date DATE DEFAULT CURRENT_DATE;