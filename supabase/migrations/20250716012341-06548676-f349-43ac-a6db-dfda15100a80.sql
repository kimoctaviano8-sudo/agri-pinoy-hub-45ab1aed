-- First, let's see which articles are duplicates
WITH duplicate_titles AS (
  SELECT title, COUNT(*) as count, ARRAY_AGG(id ORDER BY created_at DESC) as ids
  FROM news 
  GROUP BY title 
  HAVING COUNT(*) > 1
)
-- Delete older duplicates, keeping only the newest one of each title
DELETE FROM news 
WHERE id IN (
  SELECT UNNEST(ids[2:]) 
  FROM duplicate_titles
);

-- Clean up markdown image syntax from content field
UPDATE news 
SET content = REGEXP_REPLACE(
  content, 
  '^\[\!\[\]\([^\)]+\)\]\s*\n*', 
  '', 
  'g'
)
WHERE content ~ '^\[\!\[\]';

-- Remove any leading whitespace/newlines after cleaning
UPDATE news 
SET content = LTRIM(content, E'\n ')
WHERE content ~ '^[\n\s]';