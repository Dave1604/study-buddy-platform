ALTER TABLE courses ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_objectives jsonb DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites jsonb DEFAULT '[]';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'video' CHECK (content_type IN ('text','video','mixed'));

UPDATE courses SET level = 'beginner' WHERE title ILIKE '%Python%' OR title ILIKE '%Business%';
UPDATE courses SET level = 'intermediate' WHERE title ILIKE '%Web Dev%' OR title ILIKE '%Machine Learning%' OR title ILIKE '%Mathematics%';
UPDATE courses SET level = 'advanced' WHERE title ILIKE '%Data Structures%' OR title ILIKE '%Algorithm%';
UPDATE lessons SET content_type = 'video' WHERE video_url IS NOT NULL AND video_url != '';
UPDATE lessons SET content = description WHERE content = '' AND description IS NOT NULL AND description != '';
