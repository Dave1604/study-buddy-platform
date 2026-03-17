ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard'));
UPDATE quizzes SET difficulty = 'easy' WHERE title ILIKE '%Python%' OR title ILIKE '%Business%';
UPDATE quizzes SET difficulty = 'medium' WHERE title ILIKE '%Web Dev%' OR title ILIKE '%Machine Learning%' OR title ILIKE '%Maths%';
UPDATE quizzes SET difficulty = 'hard' WHERE title ILIKE '%DSA%' OR title ILIKE '%Algorithm%';
