import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PrimaryButton,
  SectionCard,
  StatCard,
  StatusPill,
  TableWrap,
  Td,
  Th,
} from "@/components/portal/ui-kit";
import {
  getMyIdentity,
  listTeacherAttendance,
  punch,
  qk,
  type TeacherAttendance,
} from "@/lib/school-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher-portal/my-attendance")({
  head: () => ({
    meta: [
      { title: "My Attendance — Chrysalis Teacher Portal" },
      {
        name: "description",
        content: "Punch in and out, review working hours and track your monthly attendance summary.",
      },
      { property: "og:title", content: "My Attendance — Chrysalis Teacher Portal" },
      { property: "og:description", content: "Daily punch log, working hours and monthly attendance summary." },
    ],
  }),
  component: MyAttendancePage,
});

const today = () => new Date().toISOString().slice(0, 10);

/** Statuses that a teacher may raise a regularization request against. */
const REGULARIZABLE = new Set(["late", "half_day", "early_departure", "absent"]);

function monthBounds(cursor: Date) {
  const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: iso(from), to: iso(to), first: from, last: to };
}

function MyAttendancePage() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(() => new Date());
  const bounds = useMemo(() => monthBounds(cursor), [cursor]);

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const staffId = meQ.data?.staff?.id;

  const rowsQ = useQuery({
    queryKey: qk.teacherAttendance(staffId),
    queryFn: () => listTeacherAttendance({ staffId }),
    enabled: !!staffId,
  });

  const rows = rowsQ.data ?? [];
  const todayRow = rows.find((r) => r.date === today()) ?? null;

  const doPunch = useMutation({
    mutationFn: (kind: "in" | "out") => punch(staffId!, kind),
    onSuccess: (_d, kind) => {
      toast.success(kind === "in" ? "Punched in" : "Punched out");
      void qc.invalidateQueries({ queryKey: qk.teacherAttendance(staffId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not record the punch"),
  });

  const monthRows = useMemo(
    () => rows.filter((r) => r.date >= bounds.from && r.date <= bounds.to),
    [rows, bounds],
  );

  const summary = useMemo(() => {
    const count = (s: string) => monthRows.filter((r) => r.status === s).length;
    const hours = monthRows.reduce((sum, r) => sum + (r.working_hours ?? 0), 0);
    return {
      present: count("present"),
      late: count("late"),
      absent: count("absent"),
      half: count("half_day") + count("early_departure"),
      hours: Math.round(hours * 10) / 10,
    };
  }, [monthRows]);

  const byDate = useMemo(() => {
    const map = new Map<string, TeacherAttendance>();
    monthRows.forEach((r) => map.set(r.date, r));
    return map;
  }, [monthRows]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PortalPageHeader
        eyebrow="My Attendance"
        title="Punch log & summary"
        description="Record your daily punch in / out, keep an eye on working hours, and raise a regularization request when a day needs correcting."
        actions={todayRow ? <StatusPill status={todayRow.status} /> : undefined}
      />

      <SectionCard
        title="Today"
        description={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      >
        {meQ.isLoading ? (
          <LoadingRows rows={1} height={72} />
        ) : !staffId ? (
          <EmptyState
            icon={CalendarCheck}
            title="No staff record linked"
            description="This demo session isn't linked to a staff member yet."
          />
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Meta label="Punch in" value={todayRow?.punch_in?.slice(0, 5) ?? "—"} />
              <Meta label="Punch out" value={todayRow?.punch_out?.slice(0, 5) ?? "—"} />
              <Meta label="Hours" value={todayRow?.working_hours != null ? `${todayRow.working_hours}` : "—"} />
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <PrimaryButton
                loading={doPunch.isPending && doPunch.variables === "in"}
                disabled={!!todayRow?.punch_in}
                onClick={() => doPunch.mutate("in")}
              >
                <LogIn className="h-4 w-4" /> Punch in
              </PrimaryButton>
              <GhostButton
                disabled={!todayRow?.punch_in || !!todayRow?.punch_out || doPunch.isPending}
                onClick={() => doPunch.mutate("out")}
              >
                <LogOut className="h-4 w-4" /> Punch out
              </GhostButton>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Present" value={summary.present} />
        <StatCard label="Late" value={summary.late} />
        <StatCard label="Half / early" value={summary.half} />
        <StatCard label="Absent" value={summary.absent} />
        <StatCard label="Hours logged" value={summary.hours} />
      </div>

      <div className="mt-5">
        <SectionCard
          title={cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          description="Monthly calendar — colours follow the recorded status."
          actions={
            <div className="flex gap-2">
              <GhostButton
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                Previous
              </GhostButton>
              <GhostButton
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                Next
              </GhostButton>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div
                key={i}
                className="mono pb-1 text-center text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: bounds.first.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: bounds.last.getDate() }).map((_, i) => {
              const day = i + 1;
              const date = `${bounds.from.slice(0, 8)}${String(day).padStart(2, "0")}`;
              const row = byDate.get(date);
              return (
                <div
                  key={date}
                  title={row ? `${date} · ${row.status}` : date}
                  className={cn(
                    "grid aspect-square place-items-center rounded-[10px] border border-line text-xs font-medium",
                    row?.status === "present" && "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                    row?.status === "late" && "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    (row?.status === "half_day" || row?.status === "early_departure") &&
                      "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400",
                    row?.status === "absent" && "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400",
                    row?.status === "leave" && "border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400",
                  )}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard title="History" description="Most recent punch records first.">
          {rowsQ.isLoading ? (
            <LoadingRows rows={5} />
          ) : rowsQ.isError ? (
            <ErrorState message={(rowsQ.error as Error)?.message} onRetry={() => void rowsQ.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No attendance yet" description="Your punch records will appear here." />
          ) : (
            <TableWrap>
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>In</Th>
                    <Th>Out</Th>
                    <Th>Hours</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 40).map((r) => (
                    <tr key={r.id}>
                      <Td>{new Date(r.date).toLocaleDateString()}</Td>
                      <Td>{r.punch_in?.slice(0, 5) ?? "—"}</Td>
                      <Td>{r.punch_out?.slice(0, 5) ?? "—"}</Td>
                      <Td>{r.working_hours ?? "—"}</Td>
                      <Td>
                        <StatusPill status={r.status} />
                      </Td>
                      <Td className="text-right">
                        {REGULARIZABLE.has(r.status) ? (
                          <Link
                            to="/teacher-portal/regularization"
                            search={{ date: r.date, reason: r.status }}
                            className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:bg-paper-2"
                          >
                            Request regularization
                          </Link>
                        ) : (
                          <span className="text-xs text-[color:var(--ink-soft)]">—</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">{label}</div>
      <div className="text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
