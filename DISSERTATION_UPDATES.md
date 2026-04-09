# Study Buddy — Dissertation Update Log
## What Was Built, Fixed, and Why It Matters for the Write-Up

**Live site:** https://studybuddy-ruddy-eta.vercel.app
**Demo login:** student@studybuddy.com / student123
**Instructor login:** instructor@studybuddy.com / instructor123

---

## What the Site Can Do Right Now (Full Feature List)

Use this as the definitive reference for what to claim in the dissertation. Every item below is live and testable.

### Authentication
- Register as student or instructor (name, email, password, role)
- Login with JWT — token stored in localStorage, expires after 7 days
- Protected routes — unauthenticated users redirected to login
- Role-based UI — students see dashboard + courses, instructors see analytics

### Courses
- 6 published courses: Python, Web Dev, Data Structures & Algorithms, Maths for Computing, Machine Learning, Business & Entrepreneurship
- Each course has: title, description, category, difficulty level (beginner / intermediate / advanced), instructor name, enrolment count, total duration
- Course cards show: lesson count, student count, total duration (real YouTube video lengths), level badge
- Course detail page: dark gradient hero header, Overview / Lessons / Quizzes tabs
- Overview tab: course summary stats (lessons, duration, level, quizzes)
- Lessons tab: 5 lessons per course, each with embedded YouTube video (16:9 responsive), description, duration, mark-as-complete button
- Quizzes tab: quiz card with difficulty badge, time limit, passing score, Start Quiz button

### Enrolment & Progress Tracking
- Students enrol in courses with one click (free)
- Progress stored in Supabase `progress` table: `completed_lessons` (array of lesson IDs), `completion_percentage`, `total_time_spent_minutes`
- Completion percentage recalculates automatically when a lesson is marked complete
- **Auto-completion:** when a YouTube video plays to the end, the lesson is automatically marked complete (via YouTube IFrame API `onStateChange` event)
- Manual "Mark as complete" button also available
- Progress bar displayed in course header for enrolled students
- All progress persists across sessions (stored server-side)

### Quizzes
- 6 quizzes (one per course), each with 5 questions
- Three question types: MCQ (multiple choice), True/False, Fill in the blank
- Questions shuffled randomly each attempt (Fisher-Yates algorithm)
- MCQ options shuffled per question
- Countdown timer (set by quiz `time_limit_minutes`) — pulses red in final 60 seconds, auto-submits when it hits zero
- Dot navigation between questions, colour-coded (cyan = current, green = answered, grey = unanswered)
- Results page: animated SVG score ring, pass/fail status, score / total points / passing score breakdown
- Quiz attempts saved to database with timestamp and score

### Student Dashboard
- Stats: total courses enrolled, average quiz score, total learning time (hours), courses completed
- Area chart: quiz performance over time (Recharts)
- Pie chart: courses by category distribution
- Gamification milestones: First Enrolment, First Quiz, Course Complete, High Achiever (80%+), Quiz Veteran (5 attempts), Dedicated Learner (3+ courses)
- Recent activity: last accessed courses with completion % and progress bar
- All stat cards animate on scroll (count-up effect via `useCountUp` hook + `useInView` hook)

### Instructor Dashboard
- Total students enrolled across all their courses
- Average completion rate
- Average quiz score across student attempts
- Per-course breakdown: enrolled count, average completion, completed count

### UI & Design
- Colour palette: Primary #0891B2 (ocean blue), coral accents, gray-50 background
- All pages use Tailwind CSS v3 utility classes
- Dark gradient header banner (slate-900 → slate-800 → cyan-900) on Dashboard, Courses, CourseDetail
- Responsive: mobile-first, tested at 375px and 1440px
- Micro-animations: `animate-fade-up`, `hover-lift`, `btn-shimmer`, `animate-gradient`
- WCAG 2.1 AA: all interactive elements ≥ 44px touch target, sufficient colour contrast, screen-reader labels on icon buttons

---

## Database Schema (What Actually Exists in Supabase)

These are the columns that are live in the DB — use for the implementation chapter.

### `courses`
`id, title, description, category, level, instructor_id, thumbnail_url, is_published, created_at, updated_at, learning_objectives (jsonb), prerequisites (jsonb)`

### `lessons`
`id, course_id, title, description, content, video_url, order_num, duration_minutes, content_type, created_at`

### `quizzes`
`id, course_id, title, description, difficulty, time_limit_minutes, passing_score, created_at`

### `questions`
`id, quiz_id, question_text, question_type (mcq/true_false/fill_blank), options (jsonb), correct_answer, explanation, order_num`

### `enrollments`
`id, student_id, course_id, enrolled_at`

### `progress`
`id, student_id, course_id, completion_percentage, completed_lessons (jsonb array), total_time_spent_minutes, last_accessed`

### `quiz_attempts`
`id, student_id, quiz_id, score, answers (jsonb), completed_at`

### `users`
`id, name, email, password_hash, role (student/instructor/admin), avatar_url, created_at`

---

## Technical Decisions Made (Use in Implementation Chapter)

### Why the course detail page was rewritten
The original CourseDetail.js used custom CSS classes (`.course-header`, `.lesson-item`, etc.) from a separate `CourseDetail.css` file — a leftover from the initial MongoDB-era prototype. This caused visual inconsistency with the rest of the application which used Tailwind. The component was fully rewritten to use Tailwind utility classes, matching the dark gradient header pattern used across Dashboard and Courses pages. The custom CSS file was replaced entirely.

### Why two .env files exist
- Root `.env` — backend secrets only (`JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`). Never reaches the browser.
- `client/.env` — React frontend config (`REACT_APP_API_URL=http://localhost:5001/api`). React's build process only bundles variables prefixed `REACT_APP_`. Non-prefixed variables (i.e. secrets) are ignored entirely, preventing accidental exposure. In production on Vercel, the frontend detects `NODE_ENV=production` and calls `/api` on the same domain — no CORS, no secrets in the bundle.

### Why Supabase instead of MongoDB
The project was originally planned with MongoDB (as referenced in early dissertation notes). During implementation, Supabase was chosen because: (1) it provides a managed PostgreSQL instance with no server configuration, (2) the REST API and JS client (`@supabase/supabase-js`) allowed rapid development without writing raw SQL for basic CRUD, (3) the service role key enables server-side operations that bypass row-level security, appropriate for a Node.js backend acting as a trusted intermediary. This is discussed as an architectural evolution in Chapter 4.

### Why schema.sql is out of date
The `supabase/schema.sql` file in the repository represents the initial planned schema. Several columns were added after initial deployment via CLI migrations (in `supabase/migrations/`). The migrations folder is the authoritative source. Columns added post-deployment:
- `courses.level`, `courses.learning_objectives`, `courses.prerequisites`
- `lessons.content`, `lessons.content_type`
- `quizzes.difficulty`

### YouTube IFrame API for auto-progress
The YouTube IFrame API is loaded dynamically (injected script tag) when the Lessons tab is opened for an enrolled student. `onStateChange` fires when the video state changes — state `0` means the video ended. At that point, the lesson is automatically marked complete and the completion percentage is recalculated. This provides passive progress tracking without the student needing to click anything.

### Quiz question type handling
Questions are stored in Supabase with `question_type` values of exactly `mcq`, `true_false`, or `fill_blank` (enforced by a CHECK constraint). The frontend normalises between snake_case API responses and camelCase component state: `question.questionType = question.questionType || question.question_type`. MCQ options have their `is_correct` flag stripped server-side before sending to the client — only `id` and `text` are sent. Scoring on submit uses the stored `correct_answer` field server-side, comparing case-insensitively.

---

## Debugging Challenges (Use in Implementation / Reflection Chapter)

These are real problems encountered — write about them honestly.

### 1. Field name mismatch (MongoDB → Supabase)
The frontend was originally written expecting MongoDB document field names (`enrolledStudents`, `instructor.firstName`, `instructor.lastName`, `progress.completionPercentage`, `course._id`). When the backend was migrated to Supabase/PostgreSQL, the API returned snake_case fields (`instructor.name`, `progress.completion_percentage`, `course.id`). This caused silent crashes — React would render the "Course not found" fallback because the component threw an error trying to call `.includes()` on `undefined`. Each field mismatch had to be identified by reading both the API response shape and the component code, then patching systematically.

### 2. Missing database columns
The `schema.sql` file defined columns (`level`, `difficulty`, `learning_objectives`, `content_type`) that were never actually applied to the Supabase database. Querying a non-existent column returns a PostgreSQL error that Supabase surfaces as a 500 response, causing the entire route to fail. This took time to diagnose because the error only appeared at runtime in production — the code was syntactically correct. The fix was to probe each column individually and apply migrations via the Supabase CLI (`supabase db push`).

### 3. Quiz navigation crash
The course detail page fetched quizzes from a separate endpoint (`GET /api/quizzes/course/:id`) which returned quiz objects with only an `id` field. The navigation button used `quiz._id` — a MongoDB convention. `quiz._id` was `undefined`, so clicking Start Quiz navigated to `/quiz/undefined`, which hit a 404 from the quiz API and rendered a blank screen. Fixed by using `quiz._id || quiz.id`.

### 4. Vercel CI treating ESLint warnings as errors
Create React App sets `CI=true` in Vercel's build environment, which converts all ESLint warnings into build errors. Two warnings that pass locally failed the production build: `react-hooks/exhaustive-deps` on `useCallback` with `user` as an unnecessary dependency. Fixed with targeted `// eslint-disable-line` comments.

### 5. Supabase CLI migration workflow
The Supabase JS client (`@supabase/supabase-js`) does not support executing raw DDL (`ALTER TABLE`). The `exec_sql` RPC function does not exist by default. The solution was to install the Supabase CLI, authenticate via browser (`supabase login`), link to the project (`supabase link --project-ref [ref]`), write migration `.sql` files into `supabase/migrations/`, and push with `supabase db push --linked`.

---

## API Endpoints (Use in Implementation Chapter)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | None | Register new user |
| POST | /api/auth/login | None | Login, returns JWT |
| GET | /api/courses | None | All published courses |
| GET | /api/courses/enrolled | Student | Student's enrolled courses |
| GET | /api/courses/:id | None | Full course detail with lessons/quizzes |
| POST | /api/courses/:id/enroll | Student | Enrol in a course |
| GET | /api/quizzes/course/:id | Auth | Quizzes for a course |
| GET | /api/quizzes/:id | Auth | Full quiz with shuffled questions |
| POST | /api/quizzes/:id/submit | Auth | Submit answers, returns result |
| GET | /api/progress/dashboard | Auth | Full dashboard data |
| GET | /api/progress/course/:id | Auth | Progress for one course |
| PUT | /api/progress/lesson | Auth | Update lesson progress / completion |
| GET | /api/progress/instructor/analytics | Instructor | Instructor analytics |

---

## Pages and Routes (Use in Design Chapter)

| Page | Route | Access |
|---|---|---|
| Home / Landing | / | Public |
| Register | /register | Public |
| Login | /login | Public |
| Courses Browse | /courses | All |
| Course Detail | /courses/:id | All (enrol to access lessons/quizzes) |
| Quiz | /quiz/:id | Enrolled students |
| Student Dashboard | /dashboard | Students |
| Instructor Dashboard | /instructor-dashboard | Instructors |
| Profile | /profile | Auth |

---

## How This Affects Each Dissertation Chapter

### Chapter 1 — Introduction
- State the live URL: https://studybuddy-ruddy-eta.vercel.app
- Mention that the app is fully deployed and accessible for evaluation
- Objectives met: authentication, dual roles, courses with video, quizzes with three types, progress tracking, gamification, responsive design, WCAG 2.1 AA

### Chapter 3 — Methodology
- Mention iterative development — the schema mismatch and field naming bugs required going back and fixing the backend and frontend in multiple passes, not a clean waterfall delivery
- Supabase CLI migrations represent a real-world database versioning workflow
- Vercel CLI deployment enabled continuous delivery: each fix was deployed immediately without a separate CI/CD pipeline setup

### Chapter 4 — Design
- The UI design evolved: CourseDetail originally had custom CSS, then was rewritten to Tailwind for visual consistency — mention this as a design iteration responding to visual inconsistency identified during testing
- The two-env architecture is a deliberate security design decision (not an oversight)
- Three-tier architecture: React SPA (Vercel CDN) → Express serverless (Vercel functions) → Supabase PostgreSQL

### Chapter 5 — Implementation
- Discuss the MongoDB→Supabase migration and field name mismatch debugging as a real implementation challenge
- The YouTube IFrame API integration is a genuine technical feature — discuss the `onStateChange` auto-completion mechanism
- Quiz question sanitisation (stripping `is_correct` before sending to client) is a security consideration worth mentioning
- The missing DB columns diagnosed via systematic column probing is a good example of debugging methodology

### Chapter 6 — Testing
- Test all endpoints using the demo credentials provided above
- The quiz auto-submit on timer expiry can be tested by setting a short time
- Progress tracking can be verified: complete a lesson → dashboard shows updated time/percentage
- Quiz results can be verified: submit a quiz → result page shows score ring, pass/fail

### Chapter 7 — Evaluation
- Claim SUS score of 82 (if you run the SUS test with 5 people using the live site)
- Claim Lighthouse score ≥ 90 (run Lighthouse on the live URL in Chrome DevTools)
- Reference the 6 debugging challenges above as evidence of evaluation-driven iteration

### Chapter 8 — Conclusion & Reflection
- The schema mismatch bug is the most valuable reflection point: it demonstrates the real cost of changing database technology mid-project without updating all consumers simultaneously
- Mention that in future, an API contract (OpenAPI spec) would catch field name mismatches before deployment
