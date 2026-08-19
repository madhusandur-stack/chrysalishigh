import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getMyIdentity, qk } from "@/lib/school-api";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { NoticeManager } from "@/components/portal/notice-composer";

export const Route = createFileRoute("/teacher-portal/notices")({
  component: TeacherNotices,
});

function TeacherNotices() {
  const { profile } = useAuth();
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const authorName = profile?.full_name ?? meQ.data?.staff?.full_name ?? "Class Teacher";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Notices"
        title="Notices"
        description="Read announcements published by the school office for your classes and students."
      />
      <NoticeManager authorName={authorName} authorRole="teacher" readOnly />
    </div>
  );
}
