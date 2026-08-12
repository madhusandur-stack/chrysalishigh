# Remix of The one and only for FREEBUFF

Build "Chrysalis Portal" — a premium student/parent + staff portal for a
school, replacing an outdated ERP. The bar is Linear, Notion, Vercel
Dashboard, and Apple's product pages — NOT a typical school ERP. Every
screen should feel calm, spacious, and alive, never cluttered, never
rainbow-colored, never like generic enterprise software.

═══════════════════════════════════
STACK
═══════════════════════════════════
- Next.js (App Router) + TypeScript + Tailwind CSS
- shadcn/ui for all base components (cards, dialogs, buttons, inputs, tables)
- Framer Motion for all animation/transitions
- Lucide icons only — no emoji icons, no mixed icon sets
- Recharts for attendance/data charts
- Supabase for auth + Postgres (students, staff, homework, announcements,
  attendance, documents, report_cards, fees, calendar_events tables)
- Everything below uses free, open-source packages only — no paid
  subscriptions required for any component.

═══════════════════════════════════
COMPONENT SOURCES
═══════════════════════════════════
Pull these specific free components instead of building from scratch or
using generic shadcn defaults:
- React Bits (https://reactbits.dev) — for the greeting-hero background:
  `npx shadcn@latest add "https://reactbits.dev/r/soft-aurora"`. Use it
  ONLY behind the "Good morning" hero on both the student and staff
  dashboards — nowhere else on the page.
- Vengeance UI (https://www.vengenceui.com) — its glass "Dock" component
  for mobile bottom navigation (`npx shadcn@latest add @vengeanceui/glass-dock`),
  and its folder-preview interaction for the Documents page. Do NOT pull
  its cursor-trail, spotlight-navbar, or hover-displacement components —
  those are built for marketing pages and don't belong in a daily-use
  dashboard.
Build the report-card/profile-photo hover reveal natively with Framer
Motion (clip-path or scale+opacity on hover/scroll-into-view) — no
component needed for that.

═══════════════════════════════════
DESIGN SYSTEM — follow exactly, do not substitute defaults
═══════════════════════════════════
Colors (CSS variables / Tailwind theme extension, both light & dark):
- --ink-blue: #16234A       (primary text-on-dark, deep headers)
- --signal-blue: #2F5FE3    (primary interactive: buttons, active nav, links)
- --emerald: #12B886        (success, attendance, positive status)
- --violet: #7C5CFC         (secondary accent: tags, categories)
- --ember: #F5893D          (due-dates/urgency ONLY — sparing use)
- --canvas (light): #F3F5FA   --canvas (dark): #0A0E1A
- --paper (light): #FFFFFF    --paper (dark): #121826
- --line (light): #E6E9F2     --line (dark): #232B3D
Never introduce additional hues. No rainbow nav anywhere. Orange appears
only on due-dates and urgent states.

Typography:
- Headings: "Sora" — Body/UI: "Inter" — ALL standalone numeric data
  (percentages, roll numbers, timestamps, due-dates, amounts, fee figures)
  in "IBM Plex Mono", applied consistently everywhere a number appears.
- Generous line-height, large friendly page titles (28–32px), whitespace
  treated as a design material, never cramped.

Signature moment: the "Good morning, {name}" hero on both the student
and staff dashboards uses React Bits' Soft Aurora background (blue →
emerald → violet, slow speed) behind a frosted-glass panel. It's the ONE
place with rich motion/color on each dashboard — everything else stays
quiet and disciplined. Disable it under prefers-reduced-motion; fall back
to a static gradient on low-end devices if frame rate drops.

Radius: 20px cards, 14px inner elements, 999px pills/badges/toggles.
Shadows: soft and layered (e.g. 0 1px 2px rgba(19,26,44,0.04), 0 8px 24px
-8px rgba(19,26,44,0.08)), sharpening slightly on hover — never harsh.
Dark mode: full parity, 300ms crossfade toggle, not a snap.

═══════════════════════════════════
MOTION LANGUAGE — elegance over spectacle, no bouncy overshoot, no confetti
═══════════════════════════════════
- Route transitions: 200ms fade + 8px slide
- Cards: staggered fade-up on mount (40–60ms stagger), lift 2–3px + soften
  shadow on hover
- Sidebar collapse/nav-group expand: height/width + opacity animate
  together, nothing jumps
- Skeleton loaders on every async surface — never a blank page or bare spinner
- Numbers count up from 0 on mount; circular rings animate stroke-dashoffset in
- Toasts slide in from top-right, one at a time; modals scale 0.96→1 + fade
- Theme switch: 300ms crossfade, icon rotates

═══════════════════════════════════
ACCESSIBILITY & QUALITY BAR
═══════════════════════════════════
- Visible keyboard focus rings (signal-blue, 2px offset) on every interactive element
- All interactive elements keyboard-reachable with proper ARIA labels
- Color never the only status indicator (pair with icon/text)
- WCAG AA contrast in both themes
- Mobile-first responsive at 375px, 768px, 1024px, 1440px

═══════════════════════════════════
STUDENT/PARENT SIDE
═══════════════════════════════════

NAVIGATION
- Desktop: collapsible left sidebar (icon+label, collapses to 76px
  icon-only, 240ms easing): Dashboard, Academics, Homework, Attendance,
  Calendar, Announcements, Report Cards, Fee Details, Documents, Gallery,
  Student Profile, Settings. Active item = subtle gradient bg + signal-blue
  text, never a bold color block.
- Mobile: Vengeance UI glass Dock with 5 primary items (Dashboard,
  Homework, Attendance, Calendar, Profile), rest under a "More" sheet.
- Top bar: search pill opening a cmd+k command-palette modal that searches
  Homework, Announcements, Calendar, Report Cards, Documents, and Teachers
  in one unified result list, grouped by type. Theme toggle. Avatar menu.

DASHBOARD (home)
Soft Aurora greeting hero: "Good morning, {name} 👋" + one-line summary
of today (classes, homework due, exams). Bento-grid below (some cards
span 2 columns): Today's Classes, Homework Due, Attendance ring,
Upcoming Exams, Quick Actions (Submit Homework / Download Report Card /
Pay Fees / View Calendar), Announcements, Upcoming Events, Latest
Uploaded Report Card. Staggered fade-up reveal on load.

ACADEMICS
Card per subject: subject name, teacher(s), a short syllabus/coverage
progress indicator (e.g. "Chapters 1–7 of 12 covered" with a thin
progress bar), and a resources/notes count. Clicking a subject opens a
detail view listing topics covered, upcoming topics, and any shared
resources or notes for that subject.

HOMEWORK
Cards per assignment: subject (violet tag), teacher, due date (mono,
ember if due within 24h), description, attachment chips, status.
Completed assignments animate with a checkmark draw-in and move to a
collapsed "Completed" section. Submission flow: click card → modal
(scale+fade) → drag-and-drop upload → animated success state. Filter/sort
bar (subject, status, due date).

ATTENDANCE
Large circular percentage ring at top. Monthly bar/heatmap chart
(Recharts) for present/absent/late/leave, color-coded to the palette.
History list below with search + month filter — cards on mobile, not a
cramped table.

CALENDAR
Custom month-grid (not a heavy library skin) matching the design system —
rounded day cells, event dots by category (exam=violet, holiday=emerald,
event=signal-blue). Horizontal slide on month change. Clicking a day
opens a side panel (not a modal) with that day's events. Upcoming-events
rail above the grid.

ANNOUNCEMENTS
Card feed, not a table. Pinned notices float to top (ember dot).
Category filter chips (General, Academic, Events, Urgent). Search. Each
card: title, snippet, posted-by, relative timestamp (mono), attachments.

REPORT CARDS
Cards per term/academic year: release date, term, status pill (Available
/ Coming Soon — muted, no actions when not uploaded). Thumbnail reveals
via Framer Motion clip-path/scale on hover or scroll-into-view. "Preview"
opens a modal with embedded PDF viewer, download button, metadata
sidebar. Search across years/terms.

FEE DETAILS
Summary card: total due, paid, outstanding — large mono numbers, animated
count-up. Payment history as cards with status pills (Paid=emerald,
Due=ember, Overdue=red — red is the one exception to the core palette,
used only here for genuine urgency). Prominent but not garish "Pay Now."

DOCUMENTS
Categorized sections (Bonafide Certificates, Fee Receipts, Circulars,
Permission Letters, Other) as card grids with file-type icon, name, date,
preview/download. Use Vengeance UI's folder-preview interaction so
opening a category feels like opening a folder. Global search + category
filter. Preview reuses the same PDF modal as Report Cards.

GALLERY
Masonry grid of photos/videos grouped by event/album. Clicking a thumbnail
opens a full-screen lightbox with smooth crossfade transitions between
images and swipe/arrow navigation. Album cover cards on the gallery home
show a short title, date, and photo count.

PROFILE
Header: large avatar (hover: subtle scale + shadow), name, class,
house-colored badge. Info grid: roll number, admission number, contact,
house (mono for ID numbers). Achievements/badges as a horizontal scroll
of cards with slight tilt-on-hover. Documents section links to Documents,
pre-filtered to this student.

SETTINGS
Grouped sections: Appearance (theme toggle), Notifications (toggles per
category — homework, announcements, attendance, fees), Account & Security
(password, linked guardian accounts), Language. Simple form-style layout,
same tokens as the rest of the app — this page should feel calm and
utilitarian, not empty.

═══════════════════════════════════
STAFF SIDE (teacher/mentor/admin)
═══════════════════════════════════

Same sidebar shell, tokens, and hero pattern as the student side — this
is a different app section, not a restyle of student content.

NAVIGATION (grouped sidebar; groups expand/collapse with smooth
max-height animation + chevron rotating 90°):
- Dashboard (flat)
- Students (group) → Student Information, Attendance
- Academics (group) → Homework, Timetable, Curriculum
- Exam (group) → Exam Schedule, Report Card Upload
- Announcements (flat)
- Collaborate (group) → Staff Messages, Shared Notes
- Documents & TC (group) → Transfer Certificates, Circulars
- Settings (flat)

STAFF DASHBOARD (home)
Soft Aurora greeting hero: "Good morning, {name} 👋" + one-line summary
of what needs attention (e.g. "4 homework submissions to review ·
Attendance pending for Class X-C"), with two actions in the hero itself:
New Announcement, Mark Attendance.

Stat-card row, each a real shortcut: Attendance Pending (count + "Mark
now"), Homework to Review (count + "Review"), Report Cards uploaded this
term (x/total + "Upload"), Pending TC Requests (count + "Open"). Below:
Today's Timetable (list), Recent Announcements You Posted (list, relative
timestamps), and a Quick Actions row (Upload Homework, Upload Report
Card, New Announcement, Add Calendar Event, Issue TC) styled identically
to the student dashboard's Quick Actions for visual consistency.

Homework upload, Report Card upload, Announcement composer, and TC
issuance each open as a form (modal or dedicated page) with drag-and-drop
upload where relevant, live preview before publishing, and a
recent-uploads list with edit/delete. Keep these fast and dense — staff
need speed — but every input, button, and card still uses the same
tokens and hover states as the student side, so it reads as one product.

═══════════════════════════════════
LOADING, RESPONSIVENESS, PERFORMANCE
═══════════════════════════════════
- Never a blank page: skeleton loaders everywhere data is async, smooth
  fade once loaded
- Mobile-first; comfortable on a parent's phone, not just desktop
- Lazy-load heavy pages (Gallery, Calendar, PDF viewers); avoid
  unnecessary re-renders; fast initial load
- Animations stay smooth even on mid-range mobile hardware — this matters
  more than any single visual flourish

═══════════════════════════════════
BUILD ORDER
═══════════════════════════════════
1. Design tokens/theme file (colors, type, radius, shadows, dark mode) —
   every page must inherit from this, never restyle per page
2. App shell: sidebar (student + staff variants) + topbar + routing
3. Student Dashboard with mock data
4. Remaining student pages: Homework, Attendance, Calendar,
   Announcements, Report Cards, Fee Details, Documents, Gallery, Profile,
   Academics, Settings
5. Staff Dashboard + upload/composer forms
6. Global search (cmd+k)
7. Connect Supabase to replace mock data once the UI is settled

Do not use default shadcn slate/zinc theme colors — override with the
palette above. Do not fall back to a generic dashboard template layout —
the bento grid + aurora hero + grouped staff sidebar are the
distinguishing structure of this product; keep them consistent across
every single page.   IMPORTANT: Do NOT create a new project or redesign from scratch. Keep the existing Chrysalis Bloom portal as the base. Preserve the current layout, styling, navigation, and existing work, but refactor, improve, and expand it according to the following requirements.

Project Goal

Transform the existing website into a premium, modern School ERP called Chrysalis Bloom for Chrysalis High, replacing CoolGurukul while maintaining a clean, intuitive, and parent-friendly experience.

The portal should feel polished like a modern SaaS product while remaining simple enough for students, parents, teachers, and school staff.

Motto:

"Preparing children for the exam called LIFE."

Branding

 Replace the current sidebar branding with only the official Chrysalis High logo.

 Remove the "Chrysalis Student Portal" text beside the logo.

 Keep generous spacing around the logo.

 Maintain Chrysalis branding throughout the portal.

 Support both Light Mode and Dark Mode.

House Colours:

 Challengers → Red

 Warriors → Blue

 Gladiators → Green

 Knights → Yellow

Use these only as subtle accent colours (profile badge, chips, achievements, etc.), never as the main UI colour.

Portal Structure

There are three completely separate portals:

Student & Parent Portal

URL:

chvportal.in

Students and parents log in here.

This portal is read-only except for profile settings.

Teacher Portal

URL:

chvportal.in/teacher

Teachers log in with school credentials.

Teachers can only manage classroom-related content.

Staff / Admin Portal

URL:

chvportal.in/staff

Staff have full administrative privileges over the system.

Login Pages

Create beautiful dedicated login pages for each portal.

Design:

 Official Chrysalis logo

 Motto beneath logo

 Glassmorphism login card

 Email field

 Password field

 Show/Hide password

 Remember Me

 Forgot Password

 Responsive

 Modern animations

 Soft Aurora animated background

 Smooth fade-in entrance

Student Dashboard

This dashboard should prioritize information, not statistics.

Hero Section:

Good Morning, [Student Name]

Preparing children for the exam called LIFE.

Below the hero:

Latest Notice

Attendance Summary

Homework Summary

Latest Report Card

Monthly Cafeteria Menu

Fee Status

Upcoming Events

Quick Links

The Noticeboard must be the most prominent element because it is the most frequently used feature in the school.

Student Pages

Noticeboard

Categories

Search

Filters

Pin important notices

PDF attachments

Image attachments

New badge

Smooth expand animation

Homework

View homework

Download attachments

View due dates

Clean card layout

Attendance

Monthly view

Yearly statistics

Percentage

Beautiful charts

Calendar

School events

Holidays

Exams

Report Cards

PDF preview

Download

Archive by academic year

Fee Details

Fee status

Payment history

Receipts

Documents

Folder-style interface

Circulars

Holiday Homework

Permission Slips

Policies

Downloads

Gallery

Album-based

Masonry layout

Lightbox

Search albums

Profile

Student photo

House badge

Parent information

Contact information

Emergency details

Student details

Monthly Cafeteria Menu

This is NOT today's menu.

The school uploads one PDF every month.

Students and parents can:

View PDF

Download PDF

View previous months

Teacher Portal

Teachers only manage academic content.

Dashboard

Homework Management

Create Homework

Edit Homework

Delete Homework

Upload PDFs

Upload Images

Set Due Dates

Assign to classes

Attendance

Select Class

Mark Attendance

Edit Attendance

Save Attendance

Notices

Create Notice

Edit Own Notice

Upload Attachments

Documents

Upload Worksheets

Upload Study Material

Upload Assignments

Calendar

View school calendar

Create class events if permitted

Student Directory

View students in assigned classes

Staff/Admin Portal

Staff have complete control.

Dashboard

Analytics

Recent activity

Quick actions

Storage

User Management

Create students

Create teachers

Create staff

Edit emails

Reset passwords

Change passwords

Assign classes

Disable accounts

Enable accounts

Academic Management

Classes

Sections

Subjects

Teacher assignments

Cafeteria Menu

Upload monthly PDF

Replace menu

Archive old menus

Report Cards

Upload PDFs

Replace PDFs

Archive by year

Documents

Upload circulars

Policies

Forms

Downloads

Noticeboard

Create notices

Pin notices

Schedule notices

Gallery

Create albums

Upload photos

Delete photos

Calendar

Holidays

Events

Exams

PTMs

Fee Management

Fee structures

Receipts

Payment status

Audit Logs

Log every important action performed by staff.

Animations

Use these libraries consistently and professionally.

React Bits

 Soft Aurora (Dashboard Hero & Login)

 Fade Content

 Animated Content

 Count Up

 Glare Hover

 Magic Bento

 Folder

 Masonry

 Spotlight Card

 Border Glow

 Tilted Card (Profile only)

 Glass Surface

Do NOT overuse animations. Keep them smooth, subtle, and premium.

Avoid flashy effects like Galaxy, Ballpit, Plasma, Lightning, Ferrofluid, Hyperspeed, Glitch Text, ASCII Text, and other distracting animations.

Design Principles

 Clean spacing

 Rounded corners

 Glassmorphism where appropriate

 Modern typography

 Responsive on desktop, tablet, and mobile

 Fast loading

 Accessible

 Smooth transitions

 Consistent iconography

The experience should feel closer to Linear, Notion, Stripe, or Apple than a traditional school ERP.

IMPORTANT

This is an improvement of the existing project, not a new application.

Reuse existing components where possible, preserve the current architecture, and progressively enhance the interface, interactions, and role-based functionality instead of replacing everything.  Detect the user's operating system and display Ctrl + K on Windows/Linux and ⌘ + K on macOS. Both shortcuts should open the same command palette.   App Shell

 Responsive collapsible left sidebar (240px expanded, 76px collapsed)

 Animated active page indicator

 Sticky top navigation bar

 Global search bar

 Command Palette accessible via Ctrl + K (Windows/Linux) and ⌘ + K (macOS)

 On-screen hint automatically adapts to the user's operating system

 Glass-style bottom navigation only on mobile devices

 Animated light/dark theme toggle with ~300ms crossfade

 Smooth 200ms page transitions using fade + slight slide.       Update the existing Chrysalis Bloom portal. Do not redesign the application or remove existing functionality. Extend and improve the Student Profile, Transport, and Staff Management modules with the following features.

Student Profile Redesign

Completely redesign the Student Profile page into a clean, modern, organized experience instead of displaying one long page of information.

Divide the profile into the following sections or tabs:

👤 Overview

Display:

 Student Photo

 Student Name

 Student ID

 Class & Section

 House (with coloured house badge)

 Date of Birth

 Gender

 Blood Group

 Nationality (if available)

House colours:

 Challengers → Red

 Warriors → Blue

 Gladiators → Green

 Knights → Yellow

👨‍👩‍👧 Parent Information

Separate Mother and Father into clean cards.

Each card should display:

 Name

 Phone Number

 Email Address

 Occupation (if available)

 Employer (if available)

Below both cards display:

 Home Address

Do not show dozens of "Not updated" fields.

If a value is empty, simply hide that field instead of displaying "Not updated".

🚌 Transport

Create a dedicated Transport section.

Display:

Pickup

 Route Number

 Pickup Location

 Pickup Time

 Driver Name

 Bus Attendant Name

 Attendant Contact Number

Drop

 Route Number

 Drop Location

 Drop Time

 Driver Name

 Bus Attendant Name

 Attendant Contact Number

🚍 Live Bus Tracking

Do not display the raw GPS URL.

Instead show a beautiful card:

My Bus

Route Number

Driver Name

Pickup Time

Drop Time

Large Primary Button:

Track Live Bus

Clicking the button should open the assigned GPS tracking URL in a new browser tab.

Example:

https://satcop.online/jsp/quickview.jsp?param=MTQxMjE4JlNjaG9vbEJ1cyZFTg==

Design the component so that every student automatically opens their own assigned bus tracking link, not a common page.

📄 Documents

Show submitted and pending documents separately.

Use coloured status badges instead of long paragraphs.

Example:

🟢 Submitted

🔶 Pending

Documents should be easy to scan.

📚 Academic Information

Display:

 First Language

 Second Language

 Sports

 Other optional academic information

Student Dashboard

Add a compact "My Bus" widget to the dashboard.

Display:

 Bus Number

 Pickup Time

 Driver Name

 Track Live button

Clicking the button should immediately open the assigned tracking URL.

Sidebar Navigation

Add a new sidebar item:

🚌 Bus Tracking

Clicking it should open the student's own assigned bus tracking page.

The student should never need to manually enter a bus number or paste a link.

Teacher Portal

Teachers should be able to view transport information for students in their assigned classes if required, but they should not be able to edit transport assignments, driver details, or tracking links.

Staff/Admin Portal

Create a new Transport Management module.

Staff should have complete control over transport information.

Features:

 Create Bus Route

 Edit Bus Route

 Delete Bus Route

 Assign Students to Bus Routes

 Update Pickup Details

 Update Drop Details

 Update Driver Name

 Update Bus Attendant

 Update Attendant Contact Number

 Update GPS Tracking URL

 Activate/Deactivate Routes

Staff should be able to search buses, routes, and students quickly.

Role-Based Permissions

Students & Parents

 View only their own transport information.

 Open their own assigned tracking link.

Teachers

 View transport information for students in their assigned classes.

 No editing permissions.

Staff/Admin

 Full Create, Read, Update, Delete (CRUD) access to all transport records and assignments.

UI & UX

Follow the existing Chrysalis Bloom design system.

Use:

 Glass cards

 Rounded corners

 Fade Content animations

 Glare Hover

 Border Glow on primary buttons

 Responsive layout

 Dark Mode support

 Mobile-friendly design

Keep the interface clean, modern, and easy to use. Prioritize readability and avoid displaying unnecessary empty fields.

💡 One additional recommendation: Instead of storing a separate GPS link for every student, structure the backend so that each student is assigned to a bus route, and the bus route contains the GPS tracking URL. That way, if Bus 12's tracking link ever changes, staff only update it once, and every assigned student automatically gets the new link. This is much easier to maintain as the school grows.    Update the existing Chrysalis Bloom project. Do NOT redesign the portal or remove existing functionality. Expand the Teacher Portal with additional permissions and management features while maintaining strict role-based access control.

Teacher Role

Teachers should have control over students only in the classes assigned to them. They must never have access to system-wide administration or data outside their assigned classes.

Student Management

Teachers should be able to open a student's profile and edit school-related information where permitted.

Allow teachers to:

 View student profiles.

 View parent contact information.

 View emergency contact information.

 View house information.

 View attendance history.

 View report cards.

 View uploaded documents.

 View fee status (read-only).

Academic Management

Teachers can:

 Create homework.

 Edit homework.

 Delete homework they created.

 Upload worksheets.

 Upload assignments.

 Upload study material.

 Upload holiday homework.

 Set homework due dates.

 Assign homework to one or multiple classes.

Attendance

Teachers can:

 Mark attendance.

 Edit attendance.

 Save attendance.

 View attendance history.

 Filter attendance by class, section, and date.

Report Cards

If enabled by the school:

Teachers can:

 Upload report card PDFs.

 Replace previously uploaded report cards.

 Assign report cards to students in their assigned classes.

Teachers cannot delete archived report cards unless explicitly permitted.

Noticeboard

Teachers can:

 Create notices.

 Edit their own notices.

 Delete their own notices.

 Upload PDF attachments.

 Upload images.

 Upload Word documents.

 Choose notice category.

 Pin notices if permission is granted.

 Schedule notices if enabled.

Teachers cannot edit notices created by other teachers unless granted permission by Staff/Admin.

Documents

Teachers can upload:

 Worksheets

 Study Material

 Assignments

 Class Documents

 Holiday Homework

Teachers can edit or remove only the files they uploaded.

Transport Information

Teachers should be able to update transport information for students in their assigned classes, if the school chooses to delegate that responsibility.

Allow teachers to edit:

 Pickup Route

 Drop Route

 Pickup Location

 Drop Location

 Pickup Time

 Drop Time

 Driver Name

 Bus Attendant Name

 Bus Attendant Contact Number

 Assigned Bus Route

 Bus Tracking Link

Changes should immediately update the student's transport information throughout the portal.

Student Profile Updates

Teachers may edit:

 Student profile photo (optional)

 Academic remarks

 Achievement records

 House assignment (only if permission is granted)

Teachers must not edit:

 Student email

 Parent email

 Passwords

 Login credentials

 Account permissions

 Fee records

 System settings

Those remain exclusive to Staff/Admin.

Search & Filtering

Teachers should be able to quickly search students by:

 Name

 Admission Number

 Student ID

 Class

 Section

Results must only include students from the teacher's assigned classes.

Dashboard Improvements

Add teacher quick actions:

 Mark Attendance

 Create Homework

 Upload Documents

 Create Notice

 Upload Report Card

 View Assigned Classes

Display summary cards showing:

 Total Assigned Classes

 Students Under Their Care

 Homework Due Today

 Notices Published

 Attendance Pending

Permissions

Teachers cannot:

 Create student accounts

 Delete student accounts

 Create teacher accounts

 Create staff accounts

 Reset passwords

 Change user emails

 Change account permissions

 Access audit logs

 Change school settings

 Manage fee structures

 Access other teachers' students unless explicitly assigned

Animations & UI

Keep the existing Chrysalis Bloom design language.

Use:

 Fade Content

 Animated Content

 Glass Surface

 Border Glow (primary buttons)

 Glare Hover

 Smooth page transitions

 Responsive layouts

 Dark Mode support

Maintain a clean, professional interface focused on productivity rather than flashy effects.

For transport editing, I'd recommend making it a permission toggle in the Staff/Admin portal (e.g., "Allow teachers to manage transport information"). That way, the school can decide whether teachers or only office staff should maintain bus details without changing the code later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db77d290-88b9-44c9-ac9a-065bc367c8df).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
