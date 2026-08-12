# School platform expansion: PUPA, CCE, Homework, Attendance & Diary

Big build. Same design language (paper/line/signal tokens, rounded cards, framer-motion, light/dark), same architecture (TanStack routes + server functions + Cloud database).

## Phase 1 — Data foundation

New database tables (all with access rules scoped to campus/teacher/student):

- `pupa_reports` — class, student, academic year, term, five long-text fields, status draft/final (one final per student per term)
- `homework_targets` + attachments on `homework` — per-student assignment, subject/chapter/topic, files, scheduled date
- `lesson_plans` + `lesson_plan_topics` — subject, chapter, topic, expected date, completed flag, remarks, completion date
- `teacher_attendance` — date, punch in/out, working hours, status (present/absent/half_day/late/early_departure/leave)
- `regularization_requests` — teacher, date, reason, explanation, document, status pending/approved/declined/info_requested, HR note
- `notice_targets` + attachments on `notices` — student/class/school scope, scheduled publish
- `cce_assessments` — class, student, subject, term, scholastic marks (FA1, FA2, SA1, FA3, FA4, SA2), co-scholastic grades (discipline, art, work, health/PE, life skills, values, participation), computed averages
- `report_cards` — term, student, PDF URL
- Storage bucket for homework/notice/report-card files

**Demo classroom**: one migration seeds a Grade IX-B class of 30 students with roll + admission numbers, DOB, parent details, plus 60 days of attendance, homework + submission status, CCE marks, PUPA reports, notices and report cards — so every screen is populated on first load.

## Phase 2 — Teacher portal

- **PUPA** (new sidebar item): class → student → year → term pickers, five paragraph fields, Save draft / Edit / Submit final with the one-final-per-term guard
- **Homework**: create, edit, delete, schedule; subject, chapter, topic, description, file attachments, due date, assign to whole class or picked students
- **Academic Planner**: subject-wise plan, tick completed topics with remarks + completion date, progress bar, % complete, pending vs completed lists
- **My Attendance**: today's punch in/out and hours, summary cards, monthly calendar, history table
- **Regularization**: "Request regularization" on late/half-day/missing-punch rows, form (date, reason, explanation, optional document), generates the HR-addressed request text, status tracking list
- **Notices**: pick individual students, multiple students, one or many classes; title, body, PDF/DOCX/PPT/image attachments

## Phase 3 — Admin portal

- **Teacher attendance dashboard**: live punch status, present/late/absent/half-day/leave counts, search, filters, date range, monthly report, CSV export
- **Student attendance dashboard**: daily view, class-wise summary, monthly percentage, absent list, trend chart
- **Regularization approvals**: teacher, date, reason, explanation, document; Approve / Decline / Request more info — status flows straight back to the teacher
- **Notices**: student / class / whole-school targeting, uploads, scheduling, edit, delete

## Phase 4 — Student portal

- **Diary** (new sidebar item) with tabs:
  - Report cards — Term 1, Term 2, Final; view, download, print
  - Homework — assigned items, due dates, attachments
  - Notices — from teachers and admins
  - PUPA summary — read-only once the teacher submits the final report
- Replace the existing Assessment/Academics view with **CCE Assessment** in report-card style layout (scholastic + co-scholastic, marks/letter grade/grade points, overall grade, subject average, overall performance)

## Phase 5 — Polish

Validation on every form, loading skeletons, empty states, toasts for success/error, keyboard and focus states, tablet + desktop layouts verified in both themes.

## Technical notes

- Reads/writes go through `createServerFn` in `src/lib/*.functions.ts`; database access rules keep teachers to their own classes and students to their own records
- Rich text uses a lightweight paragraph textarea set (no heavy editor dependency) unless you want formatting toolbars
- CCE grade calculation lives in one shared util so teacher entry and student report card agree
- Demo data ships as migration INSERTs, not runtime seeding

## Suggested order

Phase 1 first (nothing else works without it), then 2, 3, 4, 5. I can pause for review after each phase.
