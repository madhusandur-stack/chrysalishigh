import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/teacher-portal/classes")({
  component: TeacherClasses,
});

function TeacherClasses() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id, subject, classes(id, grade, section, subject, campus_id)")
        .eq("teacher_id", user!.id);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader eyebrow="Classes" title="Your assigned classes" description="All classes and sections you currently teach." />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-[20px] bg-paper-2" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center text-sm text-[color:var(--ink-soft)]">
          No classes assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((row) => {
            const cls = row.classes as { grade: string; section: string; subject: string | null } | null;
            return (
              <div key={row.id} className="rounded-[20px] border border-line bg-paper p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[color:var(--signal-soft)]">
                    <School className="h-4 w-4 text-[color:var(--signal)]" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold tracking-tight">{cls?.grade} · {cls?.section}</div>
                    <div className="text-xs text-[color:var(--ink-soft)]">{row.subject ?? cls?.subject ?? "—"}</div>
                  </div>
                </div>
                <div className="text-xs text-[color:var(--ink-soft)]">Tap into Attendance, Homework, or Notices from the sidebar to work with this class.</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
