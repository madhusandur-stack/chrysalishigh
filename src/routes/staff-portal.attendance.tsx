import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck } from "lucide-react";
import { getAttendanceOverview } from "@/lib/staff-admin.functions";
import { PortalPageHeader } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/staff-portal/attendance")({
  component: AttendanceOverview,
});

function AttendanceOverview() {
  const fn = useServerFn(getAttendanceOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["staff-attendance"],
    queryFn: () => fn({ data: {} }),
    staleTime: 30_000,
  });

  const maxTotal = Math.max(1, ...(data?.days ?? []).map((d: any) => d.total));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Attendance overview"
        description="Last 7 days of attendance and today's rate per class."
      />

      <div className="rounded-[20px] border border-line bg-paper p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Last 7 days</h2>
          <div className="text-xs text-[color:var(--ink-soft)]">Present · Late · Absent</div>
        </div>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-[12px] bg-paper-2" />
        ) : (data?.days ?? []).every((d: any) => d.total === 0) ? (
          <EmptyBlock label="No attendance recorded in the last 7 days." />
        ) : (
          <div className="flex items-end gap-3">
            {data!.days.map((d: any) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-32 w-full items-end overflow-hidden rounded-[10px] bg-paper-2">
                  {d.total > 0 ? (
                    <div className="flex w-full flex-col-reverse" style={{ height: `${(d.total / maxTotal) * 100}%` }}>
                      <div className="bg-[color:var(--signal)]" style={{ height: `${(d.present / d.total) * 100}%` }} />
                      <div className="bg-[color:var(--ember)]" style={{ height: `${(d.late / d.total) * 100}%` }} />
                      <div className="bg-red-400/70" style={{ height: `${(d.absent / d.total) * 100}%` }} />
                    </div>
                  ) : null}
                </div>
                <div className="mono text-[10px] uppercase text-[color:var(--ink-soft)]">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="text-xs font-medium">{d.rate == null ? "—" : `${d.rate}%`}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-[20px] border border-line bg-paper">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold tracking-tight">Today by class</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-[10px] bg-paper-2" />)}
          </div>
        ) : (data?.classes?.length ?? 0) === 0 ? (
          <EmptyBlock label="No classes in this campus yet." />
        ) : (
          <ul className="divide-y divide-line">
            {data!.classes.map((c: any) => (
              <li key={c.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[color:var(--signal-soft)]">
                    <CalendarCheck className="h-4 w-4 text-[color:var(--signal)]" />
                  </div>
                  <div className="text-sm font-medium">Grade {c.grade} · Section {c.section}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-[color:var(--ink-soft)]">{c.present}/{c.total} present</div>
                  <div className="w-16 text-right text-sm font-semibold">{c.rate == null ? "—" : `${c.rate}%`}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="py-8 text-center text-sm text-[color:var(--ink-soft)]">{label}</div>;
}
