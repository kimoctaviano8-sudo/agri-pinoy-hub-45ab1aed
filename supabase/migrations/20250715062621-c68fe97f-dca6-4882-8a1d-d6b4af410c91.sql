-- Add views column to news table
ALTER TABLE public.news ADD COLUMN views INTEGER DEFAULT 0;