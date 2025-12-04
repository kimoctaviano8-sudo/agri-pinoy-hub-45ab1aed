-- Final cleanup of all existing content with markdown image syntax
UPDATE news 
SET content = REGEXP_REPLACE(content, '^\[\!\[\]\([^\)]+\)\]\s*\n*', '', 'gm')
WHERE content ~ '^\[\!\[\]';

-- Also clean up content that has the pattern anywhere in the content, not just at start
UPDATE news 
SET content = REGEXP_REPLACE(content, '\[\!\[\]\([^\)]+\)\]\s*\n*', '', 'gm')
WHERE content ~ '\[\!\[\]';

-- Remove any leading whitespace/newlines after cleaning
UPDATE news 
SET content = LTRIM(content, E'\n ')
WHERE content ~ '^[\n\s]+';

-- Remove any empty lines at the start of content
UPDATE news 
SET content = REGEXP_REPLACE(content, '^[\n\r\s]*', '', 'g')
WHERE content IS NOT NULL;