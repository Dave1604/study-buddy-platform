-- Study Buddy — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL editor to initialise the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table if not exists users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  avatar_url    text default '',
  bio           text default '',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- COURSES
-- ============================================================
create table if not exists courses (
  id                  uuid primary key default uuid_generate_v4(),
  title               text not null,
  description         text not null default '',
  short_description   text default '',
  instructor_id       uuid not null references users(id) on delete cascade,
  category            text not null default 'other' check (category in ('programming','design','business','science','mathematics','language','other')),
  level               text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  thumbnail           text default '',
  learning_objectives jsonb default '[]',
  prerequisites       jsonb default '[]',
  tags                jsonb default '[]',
  total_enrollments   integer not null default 0,
  average_rating      numeric(3,2) not null default 0,
  total_ratings       integer not null default 0,
  is_published        boolean not null default false,
  estimated_duration  numeric(6,2) not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- LESSONS (child of courses)
-- ============================================================
create table if not exists lessons (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses(id) on delete cascade,
  title        text not null,
  content      text not null default '',
  content_type text not null default 'text' check (content_type in ('text','video','mixed')),
  video_url    text default '',
  duration     integer not null default 0, -- minutes
  "order"      integer not null default 0,
  resources    jsonb default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- QUIZZES
-- ============================================================
create table if not exists quizzes (
  id                  uuid primary key default uuid_generate_v4(),
  course_id           uuid not null references courses(id) on delete cascade,
  lesson_id           uuid references lessons(id) on delete set null,
  title               text not null,
  description         text default '',
  duration            integer not null default 30, -- minutes
  passing_score       integer not null default 70,  -- percent
  total_points        integer not null default 0,
  difficulty          text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  is_active           boolean not null default true,
  attempts_allowed    integer not null default 3,   -- 0 = unlimited
  shuffle_questions   boolean not null default false,
  show_correct_answers boolean not null default true,
  available_from      timestamptz default now(),
  available_until     timestamptz default null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- QUESTIONS (child of quizzes)
-- ============================================================
create table if not exists questions (
  id              uuid primary key default uuid_generate_v4(),
  quiz_id         uuid not null references quizzes(id) on delete cascade,
  question_text   text not null,
  question_type   text not null check (question_type in ('multiple-choice','true-false','multiple-answer','fill-in-blank')),
  options         jsonb not null default '[]',  -- [{id, text, is_correct}]
  correct_answer  text default null,            -- for true-false / fill-in-blank
  explanation     text default '',
  points          integer not null default 1,
  "order"         integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
create table if not exists enrollments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ============================================================
-- PROGRESS (per-enrollment lesson + course progress)
-- ============================================================
create table if not exists progress (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references users(id) on delete cascade,
  course_id             uuid not null references courses(id) on delete cascade,
  completion_percentage integer not null default 0,
  is_completed          boolean not null default false,
  completed_at          timestamptz default null,
  lessons_progress      jsonb not null default '[]',  -- [{lesson_id, completed, completed_at, time_spent}]
  total_time_spent      integer not null default 0,   -- minutes
  current_lesson_id     uuid references lessons(id) on delete set null,
  last_accessed_at      timestamptz not null default now(),
  enrolled_at           timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
create table if not exists quiz_attempts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references users(id) on delete cascade,
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  course_id    uuid not null references courses(id) on delete cascade,
  score        integer not null default 0,
  total_points integer not null default 0,
  percentage   integer not null default 0,
  passed       boolean not null default false,
  answers      jsonb not null default '[]', -- [{question_id, selected_answer, is_correct, points_earned}]
  time_spent   integer not null default 0,  -- seconds
  attempted_at timestamptz not null default now()
);

-- ============================================================
-- SYSTEM SETTINGS (single-row table)
-- ============================================================
create table if not exists system_settings (
  id                  integer primary key default 1 check (id = 1), -- enforces single row
  site_name           text not null default 'Study Buddy',
  support_email       text not null default 'support@studybuddy.local',
  maintenance_mode    boolean not null default false,
  allow_registrations boolean not null default true,
  theme_primary_color text not null default '#0891B2',
  updated_at          timestamptz not null default now()
);

-- Seed default settings row
insert into system_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_courses_instructor   on courses(instructor_id);
create index if not exists idx_courses_category     on courses(category);
create index if not exists idx_courses_published    on courses(is_published);
create index if not exists idx_lessons_course       on lessons(course_id);
create index if not exists idx_lessons_order        on lessons(course_id, "order");
create index if not exists idx_quizzes_course       on quizzes(course_id);
create index if not exists idx_questions_quiz       on questions(quiz_id);
create index if not exists idx_enrollments_user     on enrollments(user_id);
create index if not exists idx_enrollments_course   on enrollments(course_id);
create index if not exists idx_progress_user        on progress(user_id);
create index if not exists idx_progress_course      on progress(course_id);
create index if not exists idx_quiz_attempts_user   on quiz_attempts(user_id);
create index if not exists idx_quiz_attempts_quiz   on quiz_attempts(quiz_id);
create index if not exists idx_quiz_attempts_course on quiz_attempts(course_id);
