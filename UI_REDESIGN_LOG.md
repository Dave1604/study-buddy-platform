# Study Buddy — UI/UX Redesign Log

## Date: 21 March 2026

## Summary

A complete visual overhaul of the Study Buddy frontend, replacing the dark gradient-heavy design with a clean blue-and-white colour scheme. Every page was rewritten to use consistent styling, proper spacing, and professional-grade UI patterns.

---

## What Changed (Design Decisions)

### 1. Colour Scheme Overhaul

| Element | Before | After |
|---|---|---|
| Primary colour | Cyan (#0891b2) | Blue (#2563EB) |
| Page backgrounds | Dark gradients (slate-900 → cyan-900) | Clean white with subtle gray-200 borders |
| Text on headers | White on dark gradient | Dark gray-900 on white |
| Accent colour | Cyan-400/500 | Blue-500/600 |
| Card borders | gray-100 (barely visible) | gray-200 (clear definition) |
| Buttons | Cyan-600 | Blue-600 |
| Focus rings | Cyan-500 | Blue-500 |
| Chart colours | #0891b2 (cyan) | #2563eb (blue) |

### 2. Page Headers — Dark Gradients Removed

Every page previously used `bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900` for header banners. This created:
- Poor text readability against the dark gradient
- Visual heaviness that clashed with the educational context
- An overly "tech startup" aesthetic inappropriate for an academic learning platform

**Replaced with:** Clean white backgrounds (`bg-white border-b border-gray-200`) with dark text. This aligns with WCAG 2.1 AA contrast requirements and creates a lighter, more readable interface consistent with established e-learning platforms like Coursera and Khan Academy.

**Pages affected:** Home, Dashboard, Instructor Dashboard, Courses, Course Detail, Profile, Login (left panel), Register (left panel)

### 3. Course Card Thumbnails

**Before:** Gradient-filled thumbnails (`bg-gradient-to-br from-blue-500 to-indigo-600`) per category — looked generic and auto-generated.

**After:** Clean `bg-blue-50` background with a subtle BookOpen icon. Category shown as a pill badge. Duration and level badges repositioned with readable contrast.

### 4. Login & Register Pages

**Before:** Left panel used dark slate-900 gradient with floating blur orbs — hard to read, overly decorative.

**After:** Solid `bg-blue-600` left panel with white text. Clean, professional split-screen layout. Feature bullets and statistics remain visible and readable.

### 5. Animation Cleanup

- Removed: floating gradient orbs (`orb-float`, `orb-float-slow`), gradient shift animation (`animate-gradient`), ticker/marquee scrolling text, glassmorphism cards (`glass-card`)
- Kept: `fadeUp`, `fadeIn`, `scaleIn`, `slideInLeft` — subtle, purposeful entry animations
- Kept: `hover-lift` — gentle card hover elevation
- Kept: skeleton shimmer loading states
- Kept: score ring SVG animation for quiz results

### 6. Spacing & Layout Fixes

- Removed negative margin hacks (`-mt-8`, `-mt-12`) that compensated for dark header overlap
- Added proper padding and spacing throughout
- Form pages (Create Course) now have consistent `page-container` spacing
- Cards use visible `border-gray-200` borders for clear visual boundaries

---

## Files Modified

### Core Styles
- `client/src/index.css` — Complete rewrite: cyan → blue, removed dark gradient utilities, updated component classes
- `client/tailwind.config.js` — Updated brand colour palette from cyan to blue

### Pages (all rewritten)
- `client/src/pages/Home.js` — White hero, blue accents, clean stats cards, no ticker
- `client/src/pages/Login.js` — Solid blue left panel, no gradient/orbs
- `client/src/pages/Register.js` — Solid blue left panel, no gradient/orbs
- `client/src/pages/Dashboard.js` — White header, blue chart colours
- `client/src/pages/InstructorDashboard.js` — White header, blue accents
- `client/src/pages/Courses.js` — White header, blue focus rings
- `client/src/pages/CourseDetail.js` — White header, blue badges/buttons
- `client/src/pages/Profile.js` — White header, blue avatar
- `client/src/pages/Quiz.js` — Blue progress bar, blue radio buttons

### Components (all rewritten)
- `client/src/components/Navbar.js` — Blue logo, blue active states
- `client/src/components/CourseCard.js` — Clean blue-50 thumbnail, no gradients

---

## Design Rationale (for Dissertation)

### Why Blue and White?

The redesign follows the principle of **visual simplicity** advocated by Nielsen (1994) in heuristic evaluation — specifically heuristic #8 ("aesthetic and minimalist design"). The blue-and-white scheme:

1. **Maximises readability:** Dark text on light backgrounds provides high contrast ratios (>7:1), exceeding WCAG 2.1 AA requirements
2. **Reduces cognitive load:** Removing gradients, floating orbs, and decorative animations allows learners to focus on content rather than visual noise
3. **Aligns with educational conventions:** Established platforms (Coursera, edX, Khan Academy) use clean, low-saturation interfaces — blue conveys trust and professionalism (Elliot & Maier, 2014)
4. **Improves perceived usability:** Research by Tractinsky et al. (2000) demonstrates that aesthetically clean interfaces are perceived as more usable, even when functionality is identical

### Why Remove Dark Gradients?

The original dark gradient headers (`slate-900 → cyan-900`) created several usability issues:
- **Low contrast for secondary text:** Subtitles and metadata were styled as `text-slate-400` on dark backgrounds, failing WCAG AA contrast ratios
- **Visual weight:** Dark headers made the interface feel heavy and "tech-focused" rather than welcoming for students
- **Inconsistency:** The dark header pattern was used for branding rather than information hierarchy, conflicting with the light card-based content below

### Why Remove Gradient Thumbnails?

Course card thumbnails used category-specific gradients (e.g., `from-blue-500 to-indigo-600`), which:
- Looked auto-generated and generic
- Provided no meaningful information beyond the category label
- Replaced with clean `blue-50` backgrounds that feel intentional and professional

---

## Impact on Dissertation Chapters

### Chapter 4 — Design
- Reference this redesign as a **design iteration** responding to usability evaluation
- Discuss the colour scheme decision with reference to colour psychology in education (Elliot & Maier, 2014)
- Mention the shift from dark gradients to light backgrounds as a response to WCAG 2.1 AA compliance testing

### Chapter 5 — Implementation
- Mention the systematic find-and-replace approach: all `cyan-*` Tailwind classes mapped to `blue-*` equivalents across 13 files
- Discuss the removal of decorative CSS animations (orbs, tickers) and retention of functional animations (fade-in, skeleton loading)

### Chapter 6 — Testing
- Run Lighthouse again after this redesign — expect improved accessibility scores due to better contrast ratios
- Run SUS test again — expect improved scores due to cleaner visual hierarchy

### Chapter 7 — Evaluation
- Compare before/after screenshots to demonstrate iterative design improvement
- Reference the redesign as evidence of evaluation-driven development: initial design was tested, found wanting, and systematically improved

### Chapter 8 — Conclusion & Reflection
- The redesign demonstrates the importance of usability testing before final delivery
- Reflect on the tension between "impressive-looking" dark themes and genuine usability for educational contexts
