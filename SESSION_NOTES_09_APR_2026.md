# Study Buddy — Session Notes & System State
**Date:** 9 April 2026  
**Live URL:** https://studybuddy-ruddy-eta.vercel.app  
**GitHub:** https://github.com/Dave1604/study-buddy-platform  

---

## What We Did Today

### 1. Full Functionality Audit
Tested every route end-to-end — student side, instructor side, quizzes, videos, progress, dashboards. All 16 API endpoints verified working against the live Supabase database.

### 2. Bug Fixes

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Instructor dashboard showed 0 courses | Filter used `course.instructor?._id` (undefined) — Supabase returns `instructor.id` | Changed to `course.instructor?.id \|\| course.instructor_id` |
| Enrolled & lesson counts always 0 on instructor dashboard | Wrong field names (`enrolledStudents?.length`, `lessons?.length`) | Changed to `enrolled_count`, `lesson_count` |
| Quiz "Back to Course" navigated to broken URL | `quiz.course` is null — backend never returned it | Now uses `quiz.course_id` from the Supabase row |
| Profile edit form always blank | `user.firstName/lastName` don't exist in DB — only `user.name` | Split `user.name` on space to derive first/last |
| Profile enrolled count always 0 | Read from non-existent `user.enrolledCourses` | Now reads `user.enrollmentCount` returned by `/auth/me` |

### 3. Course Card Visual Redesign
Replaced all bland `bg-blue-50` + generic book icon thumbnails with category-specific gradient backgrounds and subject icons:

| Category | Gradient | Icon |
|----------|----------|------|
| Programming | Blue → Indigo | Code2 |
| Science / ML | Orange → Amber | Atom |
| Mathematics | Cyan → Blue | Calculator |
| Business | Emerald → Teal | TrendingUp |
| Design | Purple → Pink | Palette |
| Language | Rose → Pink | Globe |

Added: dot texture overlay, frosted glass duration/level pills, progress bar on enrolled cards using the card's own gradient. Applied to both the Courses page cards and Home page carousel.

### 4. Deployed to Vercel
- Committed all changes (33 files, −3,328 / +1,343 lines)
- Pushed to GitHub (`main`)
- Deployed via Vercel CLI to `pelumi-adewaras-projects/studybuddy`
- Production build: **208 KB gzipped JS**, **12.7 KB CSS**

---

## Overall System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT (React 18 + CRA)             │
│  Tailwind CSS · React Router v6 · Recharts · Axios  │
│  Lucide React · Custom hooks (useCountUp, useInView) │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST (JWT Bearer)
┌────────────────────────▼────────────────────────────┐
│              SERVER (Node.js + Express 4)            │
│  Routes: auth · courses · quizzes · progress · users │
│  Middleware: JWT auth · bcrypt · rate limiter (100/15min) │
│  Helmet · Compression · Morgan · CORS               │
└────────────────────────┬────────────────────────────┘
                         │ Supabase JS client
┌────────────────────────▼────────────────────────────┐
│         DATABASE (Supabase — PostgreSQL)             │
│  Tables: users · courses · lessons · quizzes        │
│          questions · enrollments · progress          │
│          quiz_attempts                               │
└─────────────────────────────────────────────────────┘
```

**Hosting:** Vercel (frontend static build + Node.js serverless API via `vercel.json`)  
**Auth:** Custom JWT (7-day expiry) + bcrypt (12 rounds) — NOT Supabase Auth  

---

## Feature Inventory

### Authentication
- [x] Register with name, email, password, role selection
- [x] Login with JWT stored in localStorage
- [x] `/auth/me` reload on app start (persists session)
- [x] Global 401 interceptor — auto-logout on token expiry
- [x] Rate limiting: 20 attempts / 15 min on auth routes

### Roles
| Role | Capabilities |
|------|-------------|
| Student | Enrol, watch lessons, take quizzes, view own dashboard |
| Instructor | Create/edit/delete courses, view analytics panel |
| Admin | Full user management via Admin panel |

### Courses
- [x] 6 seeded courses across 4 categories (programming, science, mathematics, business)
- [x] 30 lessons total, each with a YouTube video URL
- [x] Enrolment creates both an `enrollments` row and a `progress` row
- [x] Category-specific gradient thumbnails — no blank placeholder images
- [x] Search + filter by category + filter by level

### Lessons & Videos
- [x] YouTube IFrame API auto-loaded when Lessons tab opened
- [x] Video locked behind enrolment ("Enrol to watch" placeholder for guests)
- [x] Auto-marks lesson complete when video ends (via `onStateChange` event)
- [x] Manual "Mark as complete" button per lesson
- [x] Duration auto-updated from YouTube API on first load
- [x] Unavailable video detection with inline error message

### Quizzes
- [x] **4 question types:** MCQ, True/False, Fill-in-the-blank, Multi-select
- [x] Questions shuffled on every load
- [x] MCQ options shuffled on every load
- [x] Countdown timer — red pulse when < 60 seconds, auto-submit on expire
- [x] Unanswered question count prompt before submit
- [x] Score grading: MCQ (by option ID), True/False (string match), Fill-blank (case-insensitive)
- [x] Result stored in `quiz_attempts` table
- [x] Results screen: animated SVG score ring, pass/fail state, explanation per question
- [x] "Back to Course" correctly navigates using `quiz.course_id`

### Student Dashboard
- [x] Stat cards: Total Courses, Average Score, Time Spent, Completed (count-up animation)
- [x] Recharts AreaChart — quiz performance over time (last 10 attempts)
- [x] Recharts PieChart — courses by category
- [x] Milestones panel: 6 unlock conditions (First Enrolment, First Quiz, Course Complete, High Achiever, Quiz Veteran, Dedicated Learner)
- [x] Recent Activity list — links back to each course with progress bar

### Instructor Dashboard
- [x] Stat cards: Active Courses, Total Students, Learning Hours, Avg Quiz Score
- [x] My Courses list with enrolled count + lesson count (correct field names fixed today)
- [x] Edit / View / Delete actions per course
- [x] Analytics panel (toggle): per-course enrollment, avg completion, avg score via `/progress/instructor/analytics`
- [x] Quick Actions grid: Create Course, Analytics, Courses, Students

### Profile
- [x] Avatar (initials fallback using split of `user.name`)
- [x] Enrolled count from `/auth/me` `enrollmentCount` field
- [x] Edit form pre-populated from `user.name` split into first/last
- [x] Profile update calls `/auth/profile` → updates DB name + avatar_url

---

## Codebase Stats

| Metric | Count |
|--------|-------|
| Frontend JS files | 26 |
| Backend JS files | 17 |
| Total lines of code | ~9,500 |
| React components/pages | 20 |
| API routes | 16 |
| DB tables | 8 |
| Seeded courses | 6 |
| Seeded lessons | 30 |

---

## Lighthouse Score Prediction

> Based on: CRA production build (208 KB gzipped JS), Tailwind purged CSS (12.7 KB), Vercel CDN, Supabase in EU region, YouTube iframes on Course Detail.

| Category | Predicted Score | Reasoning |
|----------|----------------|-----------|
| **Performance** | **72–82** | CRA bundles are large even when gzipped. YouTube iframes (on CourseDetail only) add render-blocking weight on that page. Home/Dashboard/Courses pages score higher (~85). Main JS chunk is 208 KB gzipped which is above the ideal 150 KB. No lazy-loaded routes. |
| **Accessibility** | **88–94** | `sr-only` inputs on quiz radio/checkbox, `aria-label` on nav buttons and carousel dots, semantic HTML (`<section>`, `<footer>`, `<h1>`–`<h3>` hierarchy). Minor gaps: some icon-only buttons may lack labels, colour contrast of frosted glass pills over gradients. |
| **Best Practices** | **90–95** | HTTPS (Vercel), no mixed content, Helmet.js security headers on API, no deprecated APIs. Minor: CRA uses deprecated webpack middleware (logged warning only). |
| **SEO** | **82–90** | `<title>` and `<meta description>` in `index.html`, viewport meta set, links have descriptive text. Gaps: no `og:` tags, no structured data, SPA so non-JS crawlers only see shell. |

### To push Performance above 90
1. Add `React.lazy()` + `Suspense` for route-level code splitting (biggest win)
2. Add `loading="lazy"` to YouTube iframes
3. Add a `<link rel="preconnect" href="https://www.youtube.com">` in `index.html`

### To push Accessibility to 95+
1. Add `aria-label` to all icon-only buttons (edit/delete on course cards)
2. Ensure gradient-over-text contrast ratio ≥ 4.5:1 on category pill badges

---

## What's Left for Dissertation Submission

- [ ] Run actual Lighthouse test on deployed URL — screenshot for Appendix
- [ ] Run SUS usability survey (target score: 82) — need 5+ testers
- [ ] Take screenshots of all major screens for Appendix C
- [ ] Update dissertation MongoDB references → Supabase/PostgreSQL justification
- [ ] Update colour scheme references (cyan → blue #2563EB)
- [ ] Verify Appendix code listings match final implementation
- [ ] Add real test evidence (this file + screenshots) to Appendix D
