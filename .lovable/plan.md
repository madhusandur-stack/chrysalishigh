# Student Profile Upgrade

## Goal
Turn the current student Profile page into a complete, read-only school record while preserving the existing portal design, authentication, and data fetching.

## What will change
- Replace the minimal profile layout with a polished profile header showing the authenticated student's photo or initials, name, class and section, roll number, student ID, house, and campus.
- Add organized sections for Student Details, Family & Contact, Guardians, Documents, Transport, and Additional Information.
- Present separate Mother and Father cards with every available official contact field; unavailable fields will clearly read “Not provided.”
- Show guardian cards only when guardian records exist; otherwise show a clear empty state without invented people.
- Show document and transport areas from available official records only. Where this project has no linked records or fields, show truthful empty or “Not provided” states rather than mock data.
- Add a read-only “Request an Update” action that clearly directs the student to the school office without enabling direct record edits.
- Preserve loading, error, and unlinked-account states, and improve the layout for narrow mobile screens.

## Technical details
- Continue using the authenticated `getMyIdentity()` lookup; do not hardcode a campus or student.
- Reuse existing portal cards, controls, design tokens, and icons.
- Do not alter database tables, authentication, roles, policies, or existing records.
- Add route metadata only if the existing Profile metadata needs adjustment.
- Validate the page with type checks, the preview build status, and desktop/mobile browser checks.
