-- Study Buddy Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- ============================================================
-- DROP EXISTING TABLES (clean slate — handles old schema)
-- ============================================================
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- COURSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- LESSONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT,
  order_num INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- QUIZZES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')),
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_num INTEGER DEFAULT 0
);

-- ============================================================
-- ENROLLMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- ============================================================
-- PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons UUID[] DEFAULT '{}',
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- ============================================================
-- QUIZ ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- ============================================================
-- SEED DATA — Demo instructor and courses
-- ============================================================

-- Demo instructor account (password: Demo1234!)
INSERT INTO users (id, email, password_hash, name, role) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'instructor@studybuddy.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LBW7hRJFOZu',
  'Dr. Sarah Mitchell',
  'instructor'
) ON CONFLICT (email) DO NOTHING;

-- Demo student account (password: Demo1234!)
INSERT INTO users (id, email, password_hash, name, role) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'student@studybuddy.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LBW7hRJFOZu',
  'Alex Johnson',
  'student'
) ON CONFLICT (email) DO NOTHING;

-- Demo courses
INSERT INTO courses (id, title, description, category, instructor_id, is_published) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Introduction to Web Development',
  'Learn the fundamentals of HTML, CSS, and JavaScript. Build your first websites from scratch and understand how the web works.',
  'Technology',
  'a0000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT DO NOTHING;

INSERT INTO courses (id, title, description, category, instructor_id, is_published) VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'Data Structures and Algorithms',
  'Master the essential data structures and algorithms needed for technical interviews and real-world software development.',
  'Computer Science',
  'a0000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT DO NOTHING;

INSERT INTO courses (id, title, description, category, instructor_id, is_published) VALUES (
  'c0000000-0000-0000-0000-000000000003',
  'Database Design Fundamentals',
  'Understand relational databases, SQL, normalisation, and how to design efficient schemas for real applications.',
  'Computer Science',
  'a0000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT DO NOTHING;

-- Lessons for Course 1
INSERT INTO lessons (course_id, title, description, video_url, order_num, duration_minutes) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'How the Web Works', 'Understanding HTTP, browsers, and servers', 'https://www.youtube.com/watch?v=hJHvdBlSxug', 1, 15),
  ('c0000000-0000-0000-0000-000000000001', 'HTML Basics', 'Tags, elements, and page structure', 'https://www.youtube.com/watch?v=UB1O30fR-EE', 2, 20),
  ('c0000000-0000-0000-0000-000000000001', 'CSS Styling', 'Selectors, box model, and layouts', 'https://www.youtube.com/watch?v=yfoY53QXEnI', 3, 25),
  ('c0000000-0000-0000-0000-000000000001', 'JavaScript Fundamentals', 'Variables, functions, and DOM manipulation', 'https://www.youtube.com/watch?v=hdI2bqOjy3c', 4, 30);

INSERT INTO lessons (course_id, title, description, video_url, order_num, duration_minutes) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'Arrays and Linked Lists', 'Core linear data structures', 'https://www.youtube.com/watch?v=zg9ih6SVACc', 1, 20),
  ('c0000000-0000-0000-0000-000000000002', 'Stacks and Queues', 'LIFO and FIFO structures', 'https://www.youtube.com/watch?v=wjI1WNcIntg', 2, 18),
  ('c0000000-0000-0000-0000-000000000002', 'Sorting Algorithms', 'Bubble, merge, and quicksort', 'https://www.youtube.com/watch?v=kPRA0W1kECg', 3, 25);

-- Quiz for Course 1
INSERT INTO quizzes (id, course_id, title, description, time_limit_minutes, passing_score) VALUES (
  'd1000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Web Development Fundamentals Quiz',
  'Test your understanding of HTML, CSS, JavaScript, and how the web works.',
  15,
  60
);

-- Questions for Quiz 1
INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer, explanation, order_num) VALUES
(
  'd1000000-0000-0000-0000-000000000001',
  'What does HTML stand for?',
  'mcq',
  '["HyperText Markup Language", "High Technology Modern Language", "HyperText Modern Links", "Hyperlink and Text Markup Language"]',
  'HyperText Markup Language',
  'HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages. The "HyperText" refers to the hyperlinks that connect web pages.',
  1
),
(
  'd1000000-0000-0000-0000-000000000001',
  'CSS is used to style the visual appearance of a web page.',
  'true_false',
  '["True", "False"]',
  'True',
  'CSS (Cascading Style Sheets) is indeed the language used to describe the visual presentation of HTML documents, including colours, fonts, layouts, and spacing.',
  2
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Which HTTP method is typically used to submit a form with sensitive data?',
  'mcq',
  '["GET", "POST", "PUT", "DELETE"]',
  'POST',
  'POST is the correct choice. Unlike GET, POST sends data in the request body rather than the URL, making it suitable for sensitive data like passwords. GET requests are visible in the URL and browser history.',
  3
),
(
  'd1000000-0000-0000-0000-000000000001',
  'JavaScript is a server-side only programming language.',
  'true_false',
  '["True", "False"]',
  'False',
  'False — JavaScript was originally a client-side language that runs in browsers. However, with Node.js, it can also run server-side. Today JavaScript is used both client-side and server-side, making it a full-stack language.',
  4
),
(
  'd1000000-0000-0000-0000-000000000001',
  'What does the DOM stand for in web development?',
  'mcq',
  '["Document Object Model", "Digital Output Management", "Data Object Module", "Domain Object Method"]',
  'Document Object Model',
  'The DOM (Document Object Model) is a programming interface for web documents. It represents the page as a tree of nodes, allowing JavaScript to dynamically access and update the content, structure, and style of a document.',
  5
),
(
  'd1000000-0000-0000-0000-000000000001',
  'The CSS property used to change text colour is ___.',
  'fill_blank',
  NULL,
  'color',
  'The CSS property is "color" (American spelling). For example: color: blue; or color: #0891B2; Note: "colour" (British spelling) is NOT valid in CSS — it must be "color".',
  6
);

-- Quiz for Course 2
INSERT INTO quizzes (id, course_id, title, description, time_limit_minutes, passing_score) VALUES (
  'd2000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  'Data Structures Knowledge Check',
  'Assess your understanding of fundamental data structures and their time complexities.',
  12,
  65
);

INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer, explanation, order_num) VALUES
(
  'd2000000-0000-0000-0000-000000000002',
  'What is the time complexity of accessing an element in an array by index?',
  'mcq',
  '["O(1)", "O(n)", "O(log n)", "O(n²)"]',
  'O(1)',
  'Array access by index is O(1) — constant time. Since arrays store elements in contiguous memory, any element can be reached directly using its index without traversing other elements, making it one of the fastest operations in computing.',
  1
),
(
  'd2000000-0000-0000-0000-000000000002',
  'A stack follows the LIFO (Last In, First Out) principle.',
  'true_false',
  '["True", "False"]',
  'True',
  'True. A stack is a LIFO data structure — the last element added (pushed) is the first one removed (popped). Think of a stack of plates: you always add and remove from the top.',
  2
),
(
  'd2000000-0000-0000-0000-000000000002',
  'What data structure would you use to implement a browser''s back button?',
  'mcq',
  '["Queue", "Stack", "Linked List", "Hash Table"]',
  'Stack',
  'A Stack is perfect for a browser back button. Each visited page is pushed onto the stack. When you click "back", the most recent page is popped off, revealing the previous one. This LIFO behaviour matches exactly how browser history works.',
  3
),
(
  'd2000000-0000-0000-0000-000000000002',
  'The worst-case time complexity of QuickSort is O(n log n).',
  'true_false',
  '["True", "False"]',
  'False',
  'False. QuickSort has a worst-case complexity of O(n²), which occurs when the pivot is always the smallest or largest element (e.g., already sorted array with poor pivot choice). Its average case is O(n log n), which is why it remains popular in practice.',
  4
);
