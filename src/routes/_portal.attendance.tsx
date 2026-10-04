import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
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
        content: "Your daily attendance record: overall percentage, monthly calendar and date-wise history.",
      },
      { property: "og:title", content: "Attendance — Chrysalis Connect" },
      { property: "og:description", content: "Daily attendance calendar and history for students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendancePage,
});

/** Statuses that mean the school was closed — never counted as absent. */
const NON_SCHOOL = new Set(["holiday", "non_school", "weekend"]);
const ATTENDED = new Set(["present", "late"]);

type Kind = "present" | "late" | "absent" | "leave" | "holiday" | "weekend" | "unmarked" | "future";

function classify(status: string | undefined, date: Date, today: Date): Kind {
  if (status) {
    const s = status.toLowerCase();
    if (NON_SCHOOL.has(s)) return "holiday";
    if (s === "present" || s === "late" || s === "leave") return s;
    return "absent";
  }
  if (date > today) return "future";
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return "weekend";
  return "unmarked";
}

const KIND_STYLE: Record<Kind, string> = {
  present: "bg-[color:var(--emerald)]/15 text-[color:var(--emerald)] border-[color:var(--emerald)]/30",
  late: "bg-[color:var(--violet)]/15 text-[color:var(--violet)] border-[color:var(--violet)]/30",
  absent: "bg-[color:var(--ember)]/15 text-[color:var(--ember)] border-[color:var(--ember)]/30",
  leave: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  holiday: "bg-paper-2 text-[color:var(--ink-soft)] border-dashed border-[color:var(--line)]",
  weekend: "text-[color:var(--ink-soft)]/60 border-transparent",
  unmarked: "text-[color:var(--ink-soft)] border-[color:var(--line)]",
  future: "text-[color:var(--ink-soft)]/50 border-transparent",
};

const KIND_LABEL: Record<Kind, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  leave: "Leave",
  holiday: "Holiday",
  weekend: "Weekend",
  unmarked: "Not marked",
  future: "",
};

const parseLocal = (d: string) => new Date(`${d}T00:00:00`);
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function AttendancePage() {
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  const attQ = useQuery({
    queryKey: qk.attendance(student?.id),
    queryFn: () => listAttendance({ studentId: student!.id }),
    enabled: !!student,
  });

  const rows: AttendanceDay[] = attQ.data ?? [];
  const byDate = useMemo(() => new Map(rows.map((r) => [r.date, r.status])), [rows]);

  const totals = useMemo(() => {
    const t = { present: 0, late: 0, absent: 0, leave: 0, holiday: 0 };
    for (const r of rows) {
      const s = r.status.toLowerCase();
      if (NON_SCHOOL.has(s)) t.holiday++;
      else if (s === "present") t.present++;
      else if (s === "late") t.late++;
      else if (s === "leave") t.leave++;
      else t.absent++;
    }
    return t;
  }, [rows]);

  const schoolDays = totals.present + totals.late + totals.absent + totals.leave;
  const attended = rows.filter((r) => ATTENDED.has(r.status.toLowerCase())).length;
  const pct = schoolDays ? (attended / schoolDays) * 100 : 0;

  // Month navigation: start at the latest recorded month (or current month).
  const [cursor, setCursor] = useState<Date | null>(null);
  useEffect(() => {
    if (cursor || attQ.isLoading) return;
    const base = rows[0] ? parseLocal(rows[0].date) : new Date();
    setCursor(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [rows, attQ.isLoading, cursor]);

  const loading = meQ.isLoading || (!!student && attQ.isLoading);
  const header = <PageHeader title="Attendance" subtitle={`Daily attendance · Academic year ${ACADEMIC_YEAR}`} />;

  if (loading) {
    return (
      <Page>
        {header}
        <LoadingRows rows={4} height={110} />
      </Page>
    );
  }
  if (meQ.isError || attQ.isError) {
    const err = (meQ.error ?? attQ.error) as Error;
    return (
      <Page>
        {header}
        <ErrorState message={err?.message} onRetry={() => void (meQ.isError ? meQ.refetch() : attQ.refetch())} />
      </Page>
    );
  }
  if (!student) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={CalendarCheck}
          title="No student record linked"
          description="Your account isn't linked to a student record yet. Please contact the school office."
        />
      </Page>
    );
  }

  return (
    <Page>
      {header}

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance recorded yet"
          description="Once your class teacher starts marking the register, your daily record appears here."
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Overall attendance" value={`${pct.toFixed(1)}%`} />
            <StatCard label="Present days" value={attended} />
            <StatCard label="Absent days" value={totals.absent + totals.leave} tone="danger" />
            <StatCard label="School days recorded" value={schoolDays} />
          </div>
          <p className="mt-2 text-xs text-[color:var(--ink-soft)]">
            Percentage = days attended (present + late) ÷ school days marked. Holidays and weekends are not counted.
            {totals.late > 0 && ` Includes ${totals.late} late arrival${totals.late > 1 ? "s" : ""}.`}
            {totals.leave > 0 && ` ${totals.leave} leave day${totals.leave > 1 ? "s" : ""} counted as absent.`}
          </p>

          {/* Calendar */}
          {cursor && (
            <div className="mt-6">
              <MonthCalendar cursor={cursor} setCursor={setCursor} byDate={byDate} />
            </div>
          )}

          {/* History */}
          <div className="mt-6">
            <SectionCard title="Attendance history" description="Every day marked by your class teacher, newest first.">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Day</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const d = parseLocal(r.date);
                    const k = classify(r.status, d, new Date());
                    return (
                      <tr key={r.id}>
                        <Td className="font-medium">
                          {d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </Td>
                        <Td>{d.toLocaleDateString(undefined, { weekday: "long" })}</Td>
                        <Td>
                          <StatusPill status={k === "holiday" ? "draft" : r.status.toLowerCase()}>
                            {KIND_LABEL[k]}
                          </StatusPill>
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

function MonthCalendar({
  cursor,
  setCursor,
  byDate,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  byDate: Map<string, string>;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first

  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const counts = { present: 0, late: 0, absent: 0, leave: 0, holiday: 0 };
  for (const d of cells) {
    if (!d) continue;
    const k = classify(byDate.get(ymd(d)), d, today);
    if (k in counts) counts[k as keyof typeof counts]++;
  }

  return (
    <SectionCard
      title={cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      description={`Present ${counts.present + counts.late} · Absent ${counts.absent + counts.leave} · Holidays ${counts.holiday}`}
      actions={
        <div className="flex gap-1">
          <button
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-[color:var(--line)] hover:bg-paper-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-[color:var(--line)] hover:bg-paper-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = classify(byDate.get(ymd(d)), d, today);
          return (
            <div
              key={i}
              title={KIND_LABEL[k] || undefined}
              className={`flex aspect-square flex-col items-center justify-center rounded-[10px] border text-sm sm:aspect-auto sm:h-16 ${KIND_STYLE[k]}`}
            >
              <span className="mono font-medium">{d.getDate()}</span>
              {k !== "future" && k !== "weekend" && (
                <span className="hidden text-[10px] sm:block">{KIND_LABEL[k]}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["present", "late", "absent", "leave", "holiday", "unmarked"] as Kind[]).map((k) => (
          <span key={k} className={`rounded-full border px-2.5 py-1 ${KIND_STYLE[k]}`}>
            {KIND_LABEL[k]}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
