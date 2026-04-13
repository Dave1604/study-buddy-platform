# Study Buddy — Dissertation Writing Guide
## Target: 95% | 10,000 Words | Arden University Final Year Project

> This guide maps every section of your dissertation to the marking rubric.
> Written sections are marked DONE. Placeholders are marked TODO.
> Update this file as you build.

---

## MARKING RUBRIC BREAKDOWN

| Section | Weight | Target Score |
|---|---|---|
| Project Management / Background | 15% | 14/15 |
| Design | 20% | 19/20 |
| Implementation | 30% | 29/30 |
| Evaluation / Testing / Conclusion / Reflection | 25% | 24/25 |
| Report Structure / Referencing | 10% | 10/10 |

---

## WHAT MAKES 95%+ IN EACH SECTION

### Project Management / Background (15%)
**Examiner wants:** Clear rationale, SMART objectives, realistic Gantt chart, evidence of Agile sprints.

**Your dissertation has:** Strong background, rationale, aim, objectives, Agile justification. GOOD.

**TODO — Critical gaps:**
- [ ] Replace Appendix A placeholder with a REAL Gantt chart (use Excel, draw.io, or Mermaid)
- [ ] Add actual sprint logs (even reconstructed ones are fine: "Sprint 1 - Week 1: Auth implementation, 12 hours")
- [ ] Ethics form — complete the Arden ethics form if not done. Placeholder exists in Appendix D.

**Writing tip:** In Section 4.1 where you discuss Agile, add one specific sentence like:
> "Sprint 2 review identified a navigation usability issue, which was resolved in Sprint 3 by restructuring the sidebar component — demonstrating Agile's core principle of responding to change."

---

### Design (20%)
**Examiner wants:** Wireframes/mockups, ER diagram, architecture diagram, UX rationale, methodology justification.

**Your dissertation has:** Architecture description, UX principles, colour rationale, responsive design. GOOD.

**TODO — Critical gaps:**
- [ ] Add actual wireframe screenshots (use Figma free tier or hand-drawn scanned — either is fine)
- [ ] Add ER diagram (draw the Supabase tables and relationships — use draw.io)
- [ ] Add system architecture diagram (3-tier: Browser → Express API → Supabase)
- [ ] Update Section 4.2 to reflect Supabase/PostgreSQL instead of MongoDB (see note below)

**Stack justification paragraph (add to Section 4.2 / 4.3):**
> "During initial development, local MongoDB installation encountered compatibility issues with macOS. Rather than continuing with a problematic local setup, I evaluated Supabase as an alternative — a cloud-hosted PostgreSQL platform with a RESTful API layer. This architectural pivot proved advantageous: PostgreSQL's relational model is better suited to Study Buddy's normalised data structure (users, courses, quizzes, attempts all with defined foreign key relationships), and Supabase's managed infrastructure eliminated operational overhead. This decision aligns with ACID compliance requirements for quiz scoring integrity, where MongoDB's eventual consistency model would introduce complexity (Fowler, 2002). The functional result is identical to the planned MERN stack, with the backend Node.js/Express layer making the database technology transparent to the frontend."

---

### Implementation (30%) — HIGHEST WEIGHT
**Examiner wants:** Working artefact, evidence of implementation, critical reflection on decisions, code discussion.

**Your dissertation has:** Good implementation narrative. Needs real code evidence.

**TODO — Critical gaps (these directly cost marks):**
- [ ] Screenshot: Registration form working
- [ ] Screenshot: Login and JWT in localStorage (use DevTools → Application → Local Storage)
- [ ] Screenshot: Student dashboard with charts showing real data
- [ ] Screenshot: Quiz interface — question with options
- [ ] Screenshot: Quiz results page with explanatory feedback
- [ ] Screenshot: Instructor dashboard with analytics
- [ ] Screenshot: Mobile view on Chrome DevTools responsive mode
- [ ] Screenshot: Postman API test — POST /api/auth/login returning JWT
- [ ] Screenshot: Postman API test — POST /api/quizzes/:id/submit returning score + feedback
- [ ] Code snippet in Appendix B: Update with REAL code from the built application
- [ ] Lighthouse performance score (run in Chrome DevTools on deployed site)

**Critical reflection paragraphs to add/strengthen:**
- Discuss WHY you chose Supabase over local MongoDB (already drafted above)
- Discuss the quiz shuffle algorithm decision (Math.random() Fisher-Yates)
- Discuss Context API vs Redux for state management ("Redux was considered but rejected as over-engineering for a single-developer project of this scale")
- Discuss JWT expiry duration ("7 days balances security with usability for a study application")

---

### Evaluation / Testing / Conclusion / Reflection (25%)

**Examiner wants:** Comprehensive test table, usability evidence, security testing, honest evaluation.

**Your dissertation has:** Good testing narrative with tables. Needs real evidence.

**TODO:**
- [ ] Complete Appendix C with real screenshots of:
  - WAVE accessibility report (run at wave.webaim.org on deployed site)
  - Chrome Lighthouse report screenshot
  - Postman collection test results
  - At least 3 test case rows showing pass/fail/resolution
- [ ] SUS questionnaire: Ask 3 real people (friends, family) to use the app and fill a SUS form
  - SUS template: 10 questions, 1-5 Likert scale
  - Calculate score: (sum of scores - 10) × 2.5 = SUS score
- [ ] Update conclusion with honest limitations (the draft is good — keep it)

**SUS Quick Template to give testers:**
```
Rate 1 (strongly disagree) to 5 (strongly agree):
1. I think I would like to use this system frequently
2. I found the system unnecessarily complex
3. I thought the system was easy to use
4. I think I would need support to use this system
5. I found the various functions in this system were well integrated
6. I thought there was too much inconsistency in this system
7. I would imagine most people would learn to use this system very quickly
8. I found the system very cumbersome to use
9. I felt very confident using the system
10. I needed to learn a lot before I could get going with this system

SUS Score = ((Q1-1)+(5-Q2)+(Q3-1)+(5-Q4)+(Q5-1)+(5-Q6)+(Q7-1)+(5-Q8)+(Q9-1)+(5-Q10)) × 2.5
```

---

### Report Structure / Referencing (10%)

**Examiner wants:** Consistent Harvard referencing, professional formatting, clear structure.

**Your dissertation has:** Excellent Harvard references, 30+ sources. STRONG.

**TODO:**
- [ ] Replace all `(Author, 2022)` placeholder references with real citations
  - "Author, 2022" in Section 1.1 → find a real e-learning adoption statistic paper
  - "Author et al., 2021" in Section 1.2 → find a real citation about analytics gaps
  - "Author & Author, 2019" in Section 1.2 → find a real formative assessment citation
- [ ] Check page numbers are consistent
- [ ] Ensure table/figure captions are numbered (Table 3.1, Figure 4.1, etc.)
- [ ] Add figure numbers to all screenshots you add

**Recommended replacement citations:**
- (Author, 2022) → (Bao, 2020) "COVID-19 and online teaching in higher education" — highly cited e-learning growth paper
- (Author et al., 2021) → (Gasevic et al., 2015) "Let's not forget: Learning analytics are about learning"
- (Author & Author, 2019) → (Nicol and Macfarlane-Dick, 2006) "Formative assessment and self-regulated learning"

---

## CHAPTER-BY-CHAPTER STATUS

| Chapter | Status | Action Required |
|---|---|---|
| Chapter 1 — Introduction | DONE | Minor: Fix 3 placeholder references |
| Chapter 2 — Literature Review | DONE | Excellent — no changes |
| Chapter 3 — Requirements | DONE | Good — tables are comprehensive |
| Chapter 4 — Design & Implementation | DONE | Add Supabase justification paragraph |
| Chapter 5 — Testing | DONE | Add real test screenshots to Appendix C |
| Chapter 6 — Ethics | DONE | Complete Appendix D ethics form |
| Chapter 7 — Conclusion | DONE | Good — keep honest limitations |
| Chapter 8 — Reflection | DONE | Personal and genuine — keep as is |
| References | DONE | Fix 3 placeholder (Author) citations |
| Appendix A — Gantt Chart | PLACEHOLDER | Draw and export real Gantt chart |
| Appendix B — Code Snippets | PLACEHOLDER | Replace with real code from build |
| Appendix C — Testing Evidence | PLACEHOLDER | Add real screenshots |
| Appendix D — Ethics Form | PLACEHOLDER | Complete Arden ethics form |
| Appendix E — SUS Results | PLACEHOLDER | Run real SUS test with 3 participants |

---

## 3-DAY BUILD PLAN (CODE FIRST, WRITE SECOND)

### Day 1 — Backend Complete
- [ ] Supabase schema created (run schema.sql in Supabase SQL editor)
- [ ] server/index.js running
- [ ] Auth endpoints working (register, login, getMe)
- [ ] Course endpoints working (CRUD)
- [ ] Quiz endpoints working (create, fetch, submit)
- [ ] Progress endpoints working
- [ ] Instructor analytics endpoints

### Day 2 — Frontend Core
- [ ] Tailwind CSS installed and configured
- [ ] Auth pages (Login, Register)
- [ ] Home/Landing page
- [ ] Student Dashboard with Recharts
- [ ] Instructor Dashboard with Recharts
- [ ] Course browsing + enrollment

### Day 3 — Polish + Evidence
- [ ] Quiz page (shuffle, timer, feedback)
- [ ] Quiz results with explanations
- [ ] Mobile responsiveness checked
- [ ] Deploy to Vercel
- [ ] Take all screenshots for dissertation appendices
- [ ] Run Lighthouse, WAVE, Postman tests
- [ ] SUS testing with 3 people

---

## KEY ACADEMIC SENTENCES TO KEEP (Do Not Delete)
Your dissertation has excellent theory-to-practice linking. These sentences are grade-boosters:

1. "The 'testing effect' demonstrates that students engaging in repeated testing retain more information..." (Roediger and Karpicke, 2006) — justifies your quiz feature
2. "Competitive leaderboards were deliberately excluded, recognising potential demotivating effects..." (Dweck, 2006) — justifies your gamification decisions
3. "Agile's iterative sprints allowed continuous refinement of Study Buddy's user-facing components..." — good Agile reflection
4. The MoSCoW requirements tables — keep these, they show structured thinking

---

## WORD COUNT TARGET

| Section | Target Words |
|---|---|
| Introduction (Ch 1) | 800 |
| Literature Review (Ch 2) | 2,000 |
| Requirements & Design (Ch 3-4) | 2,500 |
| Implementation (Ch 4) | 1,500 |
| Testing & Evaluation (Ch 5) | 1,200 |
| Ethics (Ch 6) | 500 |
| Conclusion (Ch 7) | 600 |
| Reflection (Ch 8) | 500 |
| References | Not counted |
| **Total** | **~9,600-10,200** |

---

## QUICK WINS FOR 95%+
1. Every design decision must cite a source ("chosen because Nielsen (1994) states...")
2. Show failures and how you fixed them — examiners love this
3. Add "Critical Reflection" subheadings in implementation — not just what you built but WHY
4. Take 10 real screenshots — they turn placeholder appendices into evidence
5. Run real SUS with 3 people and use real numbers
6. Get WAVE showing 0 errors on deployed site — screenshot it
7. Lighthouse >90 performance — screenshot it
8. The references should be 5 years from now
9. Realistic timeline of gnatt chart
