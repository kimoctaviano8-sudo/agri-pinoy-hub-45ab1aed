-- Delete all duplicate articles again since new ones were imported with markdown
WITH duplicate_titles AS (
  SELECT title, COUNT(*) as count, ARRAY_AGG(id ORDER BY created_at DESC) as ids
  FROM news 
  GROUP BY title 
  HAVING COUNT(*) > 1
)
DELETE FROM news 
WHERE id IN (
  SELECT UNNEST(ids[2:]) 
  FROM duplicate_titles
);

-- Clean up ALL content fields that have markdown image syntax
UPDATE news 
SET content = REGEXP_REPLACE(content, '^\[\!\[\]\([^\)]+\)\]\s*\n*', '', 'g')
WHERE content LIKE '[![](%';

-- Remove leading whitespace/newlines
UPDATE news 
SET content = LTRIM(content, E'\n ')
WHERE content ~ '^[\n\s]+';