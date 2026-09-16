# Finish Student Portal Fixes and Timetable

## Scope
Complete the student-only fixes without changing teacher/staff experiences or replacing existing database records.

## Implementation
1. **Identity and access**
   - Resolve the student record from the signed-in account instead of a generic demo flag.
   - Stabilize student portal refresh/direct-link authentication and retain role routing.
   - Surface a clear relationship error if an account has no linked student/class, rather than masking it with a hardcoded campus.

2. **Student dashboard**
   - Replace mock student information with the authenticated student’s name and class.
   - Replace fake cards with real timetable, attendance, homework, and notice reads.
   - Add honest loading, error, and empty states; omit unavailable PTM/event values rather than inventing them.

3. **Student timetable**
   - Lock the page to the authenticated student’s class and latest published timetable.
   - Recreate the uploaded reference structure: weekday rows, period/time columns, distinct snack/lunch break columns, subject and teacher cells, last-updated information, and generated date.
   - Preserve the existing timetable slot format so current staff/teacher editing and publishing continue to work.
   - Add print and downloadable CSV controls, a day selector, mobile cards, and print-specific styling.

4. **Validation**
   - Check the build and runtime logs.
   - Sign in as the Varthur demo student and verify dashboard, timetable, refresh/direct URL, desktop, mobile, download, and print-ready layout.

## Database
No destructive migration, reset, or reseeding. Existing timetable rows remain unchanged; the page will truthfully show only currently published data.
