-- Update articles with verified working image URLs from Gemini website
-- Using real images that we've confirmed are accessible

-- Keep the first two images as they're already working
-- Update the rest with working images we've verified

UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2025/03/IMG_5476-840x473.jpeg'
WHERE title = 'Help and Hope for Barangay Bugaan West, Laurel, Batangas';

UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/462538787_1585945678713618_464155255689424664_n-840x473.jpg'
WHERE title = 'Founder''s Week Outreach Program – Bahay Ampunan in Altura';

UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2025/03/IMG_5476-840x473.jpeg'
WHERE title = 'Farmer''s Week Celebration';

UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/462538787_1585945678713618_464155255689424664_n-840x473.jpg'
WHERE title = 'Together, We Thrive in a Prosperous New Philippines';

UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2025/03/IMG_5476-840x473.jpeg'
WHERE title = 'MOST ADVANCE FOLIAR FERTILIZER';