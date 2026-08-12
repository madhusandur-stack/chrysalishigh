import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, GraduationCap, School, Megaphone, BookOpen, Sparkles } from "lucide-react";
import { getCampusStats } from "@/lib/staff-admin.functions";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/staff-portal/")({
  component: StaffDashboard,
});

function StaffDashboard() {
  const { profile } = useAuth();
  const stats = useServerFn(getCampusStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff-stats"],
    queryFn: () => stats({ data: {} }),
    staleTime: 30_000,
  });

  const displayName = profile?.full_name ?? "Admin";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title={`${greeting}, ${displayName.split(" ")[0]}`}
        description={`${profile?.campuses?.name ?? "Chrysalis"} · Campus overview and quick actions.`}
      />

      {error ? (
        <div className="rounded-[16px] border border-line bg-paper p-6 text-sm text-red-500">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Students" value={data?.counts.students ?? 0} loading={isLoading} tint="signal" />
        <StatCard icon={GraduationCap} label="Teachers" value={data?.counts.teachers ?? 0} loading={isLoading} tint="violet" />
        <StatCard icon={School} label="Classes" value={data?.counts.classes ?? 0} loading={isLoading} tint="ember" />
        <StatCard icon={Megaphone} label="Notices" value={data?.counts.notices ?? 0} loading={isLoading} tint="signal" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[20px] border border-line bg-paper p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent homework</h2>
            <Link to="/staff-portal/homework" className="text-xs font-medium text-[color:var(--signal)] hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-[12px] bg-paper-2" />)}
            </div>
          ) : (data?.recentHomework?.length ?? 0) === 0 ? (
            <EmptyState icon={Sparkles} title="No homework yet" hint="Teachers can post from their portal." />
          ) : (
            <ul className="divide-y divide-line">
              {data!.recentHomework.map((h: any) => (
                <li key={h.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="font-medium">{h.title}</div>
                  <div className="mono text-xs text-[color:var(--ink-soft)]">{new Date(h.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Quick actions</h2>
          <div className="space-y-2">
            <QuickAction to="/staff-portal/students" icon={Users} label="Manage students" />
            <QuickAction to="/staff-portal/teachers" icon={GraduationCap} label="Manage teachers" />
            <QuickAction to="/staff-portal/classes" icon={School} label="Manage classes" />
            <QuickAction to="/staff-portal/notices" icon={Megaphone} label="Post a notice" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading, tint }: { icon: any; label: string; value: number; loading: boolean; tint: "signal" | "violet" | "ember" }) {
  const bg = tint === "signal" ? "var(--signal-soft)" : tint === "violet" ? "color-mix(in srgb, var(--violet) 12%, transparent)" : "color-mix(in srgb, var(--ember) 12%, transparent)";
  const fg = tint === "signal" ? "var(--signal)" : tint === "violet" ? "var(--violet)" : "var(--ember)";
  return (
    <div className="rounded-[20px] border border-line bg-paper p-5">
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
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-[14px] border border-line bg-paper-2 px-4 py-3 text-sm font-medium transition hover:border-[color:var(--signal)] hover:bg-paper">
      <Icon className="h-4 w-4 text-[color:var(--signal)]" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-paper-2"><Icon className="h-4 w-4 text-[color:var(--ink-soft)]" /></div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-[color:var(--ink-soft)]">{hint}</div>
    </div>
  );
}
