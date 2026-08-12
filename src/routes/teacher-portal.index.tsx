import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, CalendarCheck, Megaphone, School, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/teacher-portal/")({
  component: TeacherDashboard,
});

function useTeacherStats(userId: string | null) {
  return useQuery({
    queryKey: ["teacher-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [assignments, homework, notices] = await Promise.all([
        supabase.from("teacher_assignments").select("id, class_id, subject, classes(grade, section, subject)").eq("teacher_id", userId!),
        supabase.from("homework").select("id, title, subject, due_date, created_at").eq("teacher_id", userId!).order("created_at", { ascending: false }).limit(5),
        supabase.from("notices").select("id, title, created_at").eq("author_id", userId!).order("created_at", { ascending: false }).limit(3),
      ]);
      return {
        assignments: assignments.data ?? [],
        homework: homework.data ?? [],
        notices: notices.data ?? [],
      };
    },
  });
}

function TeacherDashboard() {
  const { profile, user } = useAuth();
  const { data, isLoading } = useTeacherStats(user?.id ?? null);
  const classCount = data?.assignments.length ?? 0;
  const homeworkCount = data?.homework.length ?? 0;
  const noticeCount = data?.notices.length ?? 0;
  const displayName = profile?.full_name ?? "Teacher";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Teacher Portal"
        title={`${greeting}, ${displayName.split(" ")[0]}`}
        description={`${profile?.campuses?.name ?? "Chrysalis"} · Here's a snapshot of your day.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={School} label="Assigned classes" value={classCount} loading={isLoading} tint="signal" />
        <StatCard icon={BookOpen} label="Recent homework" value={homeworkCount} loading={isLoading} tint="violet" />
        <StatCard icon={Megaphone} label="Notices posted" value={noticeCount} loading={isLoading} tint="ember" />
        <StatCard icon={CalendarCheck} label="Today's date" value={new Date().getDate()} loading={false} tint="signal" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[20px] border border-line bg-paper p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Your classes</h2>
            <Link to="/teacher-portal/classes" className="text-xs font-medium text-[color:var(--signal)] hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-[12px] bg-paper-2" />
              ))}
            </div>
          ) : classCount === 0 ? (
            <EmptyState
              icon={School}
              title="No classes assigned yet"
              hint="Ask your campus admin to add you to a class — or seed demo data from the login screen."
            />
          ) : (
            <ul className="space-y-2">
              {data!.assignments.map((a) => {
                const cls = a.classes as { grade: string; section: string; subject: string | null } | null;
                return (
                  <li key={a.id} className="flex items-center justify-between rounded-[14px] border border-line bg-paper-2 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold">{cls?.grade} · {cls?.section}</div>
                      <div className="text-xs text-[color:var(--ink-soft)]">{a.subject ?? cls?.subject ?? "—"}</div>
                    </div>
                    <span className="mono rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--ink-soft)]">Active</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Quick actions</h2>
          <div className="space-y-2">
            <QuickAction to="/teacher-portal/attendance" icon={CalendarCheck} label="Take attendance" />
            <QuickAction to="/teacher-portal/homework" icon={BookOpen} label="Upload homework" />
            <QuickAction to="/teacher-portal/notices" icon={Megaphone} label="Post a notice" />
            <QuickAction to="/teacher-portal/students" icon={Users} label="View students" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[20px] border border-line bg-paper p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Recent homework</h2>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-[12px] bg-paper-2" />
        ) : homeworkCount === 0 ? (
          <EmptyState icon={Sparkles} title="No homework yet" hint="Create one from the Homework tab." />
        ) : (
          <ul className="divide-y divide-line">
            {data!.homework.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{h.title}</div>
                  <div className="text-xs text-[color:var(--ink-soft)]">{h.subject ?? "—"}</div>
                </div>
                <div className="mono text-xs text-[color:var(--ink-soft)]">{h.due_date ?? "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading, tint }: { icon: typeof School; label: string; value: number; loading: boolean; tint: "signal" | "violet" | "ember" }) {
  const bg = tint === "signal" ? "var(--signal-soft)" : tint === "violet" ? "color-mix(in srgb, var(--violet) 12%, transparent)" : "color-mix(in srgb, var(--ember) 12%, transparent)";
  const fg = tint === "signal" ? "var(--signal)" : tint === "violet" ? "var(--violet)" : "var(--ember)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[20px] border border-line bg-paper p-5"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-[12px]" style={{ background: bg }}>
          <Icon className="h-[18px] w-[18px]" style={{ color: fg }} strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[color:var(--ink-soft)]">{label}</div>
          <div className="mt-0.5 text-2xl font-semibold tracking-tight">
            {loading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-paper-2" /> : value}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof School; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[14px] border border-line bg-paper-2 px-4 py-3 text-sm font-medium transition hover:border-[color:var(--signal)] hover:bg-paper"
    >
      <Icon className="h-4 w-4 text-[color:var(--signal)]" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof School; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-paper-2">
        <Icon className="h-4 w-4 text-[color:var(--ink-soft)]" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-[color:var(--ink-soft)]">{hint}</div>
    </div>
  );
}
