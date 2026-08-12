import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { NoticeManager } from "@/components/portal/notice-composer";

export const Route = createFileRoute("/staff-portal/notices")({
  component: NoticesPage,
});

function NoticesPage() {
  const { profile } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Notices"
        description="Publish announcements school-wide, to selected classes, or to individual students. Pin important ones to the top."
      />
      <NoticeManager authorName={profile?.full_name ?? "School Office"} authorRole="admin" />
    </div>
  );
}
