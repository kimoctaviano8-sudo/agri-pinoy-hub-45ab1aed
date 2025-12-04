-- Remove markdown image syntax from news content 
UPDATE news SET content = TRIM(BOTH E'\n' FROM REGEXP_REPLACE(content, '^\[\!\[\]\([^\)]+\)\]\s*\n*', '', 'g'))
WHERE content ~ '^\[\!\[\]\([^\)]+\)\]';

-- Also remove any remaining empty lines at the beginning of content
UPDATE news SET content = TRIM(LEADING E'\n' FROM content) 
WHERE content ~ '^[\n\s]*';