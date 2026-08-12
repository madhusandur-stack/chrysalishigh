import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { TimetableEditor } from "@/components/portal/timetable-editor";

export const Route = createFileRoute("/staff-portal/timetable")({
  component: AdminTimetable,
});

function AdminTimetable() {
  const { profile } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Timetable Management"
        description="Edit any class timetable, preview the result, and publish it to students."
      />
      <TimetableEditor editorName={profile?.full_name ?? "School Office"} />
    </div>
  );
}
