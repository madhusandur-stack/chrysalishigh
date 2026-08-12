import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { TimetableEditor } from "@/components/portal/timetable-editor";

export const Route = createFileRoute("/teacher-portal/timetable")({
  component: TeacherTimetable,
});

function TeacherTimetable() {
  const { profile } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Timetable"
        title="Timetable Management"
        description="Build the weekly schedule, preview it, then publish so students see the latest version."
      />
      <TimetableEditor editorName={profile?.full_name ?? "Class Teacher"} />
    </div>
  );
}
