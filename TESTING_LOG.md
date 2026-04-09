# Study Buddy — Testing Log
**Date:** 2026-04-09  
**Server:** http://localhost:5001  
**Client:** http://localhost:3001  

---

## Bug Fixes Applied This Session

| # | Component | Bug | Fix |
|---|-----------|-----|-----|
| 1 | `InstructorDashboard.js` | Instructor courses never showed — filter used `course.instructor?._id` (undefined) | Changed to `course.instructor?.id \|\| course.instructor_id` |
| 2 | `InstructorDashboard.js` | Enrolled/lesson counts always 0 — used wrong field names | Changed `enrolledStudents?.length` → `enrolled_count`, `lessons?.length` → `lesson_count` |
| 3 | `Quiz.js` | "Back to Course" button navigated to undefined — `quiz.course` is null | Changed to `quiz.course_id \|\| quiz.course?._id` |
| 4 | `Profile.js` | Edit form always blank — `user.firstName/lastName` don't exist | Split `user.name` into firstName/lastName on init |
| 5 | `Profile.js` | Enrolled count always 0 | Now uses `user.enrollmentCount` (returned by `/auth/me`) |

---

## API Endpoint Test Results

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/health` | GET | ✅ Pass | Returns `ok` |
| `/api/auth/register` | POST | ✅ Pass | Creates user, returns JWT |
| `/api/auth/login` | POST | ✅ Pass | Returns user + token |
| `/api/auth/me` | GET | ✅ Pass | Returns user + enrollmentCount |
| `/api/courses` | GET | ✅ Pass | Returns 6 published courses |
| `/api/courses/enrolled` | GET | ✅ Pass | Returns enrolled courses with progress |
| `/api/courses/:id` | GET | ✅ Pass | Returns course with lessons, isEnrolled, progress |
| `/api/courses/:id/enroll` | POST | ✅ Pass | Creates enrollment + progress row |
| `/api/quizzes/course/:id` | GET | ✅ Pass | Returns quizzes for course |
| `/api/quizzes/:id` | GET | ✅ Pass | Returns quiz with shuffled questions, options stripped of `is_correct` |
| `/api/quizzes/:id/submit` | POST | ✅ Pass | Grades MCQ/true_false/fill_blank, saves attempt, returns score |
| `/api/progress/dashboard` | GET | ✅ Pass | Returns overview stats, quiz chart, milestones, category breakdown |
| `/api/progress/lesson` | PUT | ✅ Pass | Marks lesson complete, recalculates completion % |
| `/api/progress/course/:id` | GET | ✅ Pass | Returns progress row for course |
| `/api/progress/instructor/analytics` | GET | ✅ Pass | Returns per-course analytics for instructor |
| `/api/auth/profile` | PUT | ✅ Pass | Updates user name / avatar |

---

## Feature Verification

### Student Side
- [x] **Register** — creates account with role selection
- [x] **Login** — JWT stored, redirects to student dashboard
- [x] **Student Dashboard** — shows stat cards, quiz performance chart, category pie chart, milestones, recent activity
- [x] **Courses page** — lists all published courses, splits enrolled/available
- [x] **Course Detail** — header with meta, Overview/Lessons/Quizzes tabs, enrol button
- [x] **Lesson Videos** — YouTube embeds behind enrolment gate; auto-mark complete on video end
- [x] **Mark as Complete** — manual button per lesson, updates progress %
- [x] **Quiz flow** — shuffle questions, MCQ/true_false/fill_blank rendered correctly
- [x] **Quiz timer** — countdown pill, red pulse when < 60s, auto-submit on expire
- [x] **Quiz results** — animated score ring, pass/fail state, "Back to Course" uses `course_id`
- [x] **Profile** — shows name (split from DB), enrolled count, edit form pre-populated

### Instructor Side
- [x] **Instructor Dashboard** — header, stat cards (courses, students, hours, avg score)
- [x] **My Courses list** — now correctly filters by `instructor.id`, shows `enrolled_count` and `lesson_count`
- [x] **Create Course** — form accessible at `/instructor/create-course`
- [x] **Edit Course** — form accessible at `/instructor/edit-course/:id`
- [x] **Delete Course** — confirm dialog then delete
- [x] **Analytics panel** — toggle shows InstructorAnalytics component
- [x] **Quick Actions** — Create Course, Analytics buttons work

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Instructor | instructor@studybuddy.com | password123 |
| Student | student@studybuddy.com | password123 |
| Student | bob@studybuddy.com | password123 |

---

## Known Limitations / Out of Scope

- Instructor "View Students" quick action navigates to `/instructor/students` which has no route (non-critical, no crash — redirects to home)
- Instructor recent activity panel shows static placeholder data (not real DB data)
- Profile "Completed" and "Avg Score" stats require separate API call not yet wired into profile page (shows 0)
- YouTube iframe API error detection works but replaces with inline message only

---

## Dissertation Evidence Notes

- All 4 question types implemented: MCQ, True/False, Fill-in-the-blank, Multi-select
- Gamification: 6 milestone types, no leaderboards
- JWT + bcrypt auth confirmed working
- Role-based access: student/instructor/admin routes all gated
- Recharts line chart + pie chart on student dashboard
- YouTube video embed with auto-completion tracking
- Responsive layout: mobile sticky nav bar on quiz page
- WCAG: sr-only inputs on radio/checkbox, aria-labels on nav buttons
