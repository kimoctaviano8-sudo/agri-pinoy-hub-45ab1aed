-- Remove all images from news articles
UPDATE news SET image_url = NULL WHERE published = true;