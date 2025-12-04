-- Update existing news articles with working image URLs from Gemini website

-- Update the corn derby article
UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/462538787_1585945678713618_464155255689424664_n-840x473.jpg'
WHERE title = 'Gemini secures 2nd place in highest yield category with Totem Biofertilizer.';

-- Update the relief goods article  
UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/483851764_1712346979440152_7237334932851761825_n-840x473.jpg'
WHERE title = 'Help and Hope for Barangay Bugaan West, Laurel, Batangas';

-- Update the founder's week article
UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/471593503_1658395078176009_5055844651701006949_n-840x473.jpg'
WHERE title = 'Founder''s Week Outreach Program – Bahay Ampunan in Altura';

-- Update the farmer's week celebration article
UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/488529636_1755953131745103_8318020885097354700_n-840x473.jpg'
WHERE title = 'Farmer''s Week Celebration';

-- Update the rice technology article
UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/478896725_1708001253213978_2516756655327925639_n-840x473.jpg'
WHERE title = 'Together, We Thrive in a Prosperous New Philippines';

-- Update the foliar fertilizer article
UPDATE news SET image_url = 'https://geminiagri.com/wp-content/uploads/2022/07/485166871_1738669136780523_9184607950066994142_n-840x473.jpg'
WHERE title = 'MOST ADVANCE FOLIAR FERTILIZER';