import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page, PageHeader } from "@/components/portal/page";
import { CountUp } from "@/components/portal/count-up";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  SectionCard,
  StatCard,
  StatusPill,
  TableWrap,
  Td,
  Th,
} from "@/components/portal/ui-kit";
import { ACADEMIC_YEAR, getMyIdentity, listAttendance, qk, type AttendanceDay } from "@/lib/school-api";

export const Route = createFileRoute("/_portal/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Chrysalis Connect" },
      {
        name: "description",
        content: "Daily attendance record with monthly breakdown, overall percentage and recent history.",
      },
      { property: "og:title", content: "Attendance — Chrysalis Connect" },
      { property: "og:description", content: "Track presence month by month across the academic year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendancePage,
});

const MONTH_LABEL = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });

type MonthRow = { key: string; month: string; present: number; absent: number; late: number };

/** Groups raw attendance days into per-month present/absent/late counts. */
function groupByMonth(rows: AttendanceDay[]): MonthRow[] {
  const map = new Map<string, MonthRow>();
  for (const r of rows) {
    const key = r.date.slice(0, 7);
    const entry = map.get(key) ?? { key, month: MONTH_LABEL(key), present: 0, absent: 0, late: 0 };
    if (r.status === "present") entry.present += 1;
    else if (r.status === "late") entry.late += 1;
    else entry.absent += 1;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function AttendancePage() {
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  const attQ = useQuery({
    queryKey: qk.attendance(student?.id),
    queryFn: () => listAttendance({ studentId: student!.id }),
    enabled: !!student,
  });

  const rows = attQ.data ?? [];
  const monthly = useMemo(() => groupByMonth(rows), [rows]);

  const totals = useMemo(() => {
    const t = { present: 0, absent: 0, late: 0 };
    for (const m of monthly) {
      t.present += m.present;
      t.absent += m.absent;
      t.late += m.late;
    }
    return t;
  }, [monthly]);

  const recorded = totals.present + totals.absent + totals.late;
  const overall = recorded ? Math.round(((totals.present + totals.late) / recorded) * 100) : 0;
  const recent = rows.slice(0, 12);
  const loading = meQ.isLoading || attQ.isLoading;

  if (loading) {
    return (
      <Page>
        <PageHeader title="Attendance" subtitle="Your presence, month by month." />
        <LoadingRows rows={4} height={110} />
      </Page>
    );
  }

  if (attQ.isError) {
    return (
      <Page>
        <PageHeader title="Attendance" subtitle="Your presence, month by month." />
        <ErrorState message={(attQ.error as Error)?.message} onRetry={() => void attQ.refetch()} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Attendance" subtitle="Your presence, month by month." />

      {recorded === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance recorded yet"
          description="Once your class teacher starts marking the register, your record appears here."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card-surface flex items-center gap-6 p-6 lg:col-span-1">
              <Ring value={overall} />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">Overall</div>
                <div className="mono mt-1 text-[40px] font-semibold leading-none">
                  <CountUp to={overall} suffix="%" />
                </div>
                <div className="mt-2 text-xs text-[color:var(--ink-soft)]">Academic year {ACADEMIC_YEAR}</div>
              </div>
            </div>

            <div className="card-surface p-6 lg:col-span-2">
              <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
                Monthly breakdown
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--ink-soft)", fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--ink-soft)", fontSize: 12 }}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--line)",
                        background: "var(--paper)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="present" fill="var(--emerald)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="absent" fill="var(--ember)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="late" fill="var(--violet)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-[color:var(--ink-soft)]">
                <Legend color="var(--emerald)" label="Present" />
                <Legend color="var(--ember)" label="Absent" />
                <Legend color="var(--violet)" label="Late" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Days recorded" value={recorded} />
            <StatCard label="Present" value={totals.present} />
            <StatCard label="Late" value={totals.late} />
            <StatCard label="Absent" value={totals.absent} tone="danger" />
          </div>

          <div className="mt-6">
            <SectionCard title="Recent days" description="Your last twelve marked days.">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Day</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => {
                    const d = new Date(`${r.date}T00:00:00`);
                    return (
                      <tr key={r.id}>
                        <Td className="font-medium">
                          {d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </Td>
                        <Td>{d.toLocaleDateString(undefined, { weekday: "long" })}</Td>
                        <Td>
                          <StatusPill status={r.status}>{r.status.replace("_", " ")}</StatusPill>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </SectionCard>
          </div>
        </>
      )}
    </Page>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0" aria-hidden="true">
      <circle cx="70" cy="70" r={r} strokeWidth="10" className="stroke-[color:var(--line)]" fill="none" />
      <motion.circle
        cx="70"
        cy="70"
        r={r}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        className="stroke-[color:var(--emerald)]"
        transform="rotate(-90 70 70)"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * value) / 100 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
