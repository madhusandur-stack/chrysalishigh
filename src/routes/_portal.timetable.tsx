import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Download, Printer } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { EmptyState, ErrorState, GhostButton, LoadingRows, PrimaryButton, Select } from "@/components/portal/ui-kit";
import { TimetableGrid } from "@/components/portal/timetable-grid";
import {
  ACADEMIC_YEAR,
  DAYS,
  getMyIdentity,
  getTimetable,
  qk,
  todayDay,
} from "@/lib/school-api";

export const Route = createFileRoute("/_portal/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — Chrysalis Connect" },
      {
        name: "description",
        content: "Your latest published class timetable: periods, timings, subjects, teachers and rooms.",
      },
      { property: "og:title", content: "Timetable — Chrysalis Connect" },
      { property: "og:description", content: "The current published weekly schedule for your class." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentTimetable,
});

function StudentTimetable() {
  const [day, setDay] = useState<string>("all");

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;
  const classId = student?.class_id ?? "";
  const classLabel = student?.classes
    ? `${student.classes.grade} – ${student.classes.section}`
    : classId
      ? "Assigned class"
      : "Not linked";

  const ttQ = useQuery({
    queryKey: qk.timetable(classId, ACADEMIC_YEAR),
    queryFn: () => getTimetable(classId, ACADEMIC_YEAR),
    enabled: !!classId,
    // Students always see the latest published version, no hard refresh needed.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const slots = useMemo(() => ttQ.data?.published_slots ?? [], [ttQ.data]);
  const publishedAt = ttQ.data?.published_at ?? null;

  const loading = meQ.isLoading || (!!classId && ttQ.isLoading);

  function downloadCsv() {
    if (!slots.length) return;
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [["Day", "Period", "Start", "End", "Subject", "Teacher", "Room", "Break"], ...slots.map((slot) => [slot.day, slot.period_no, slot.start_time, slot.end_time, slot.subject, slot.teacher, slot.room, slot.is_break ? "Yes" : "No"])]
      .map((row) => row.map(quote).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `timetable-${student?.full_name.replace(/\s+/g, "-").toLowerCase() ?? "student"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page>
      <div className="print-hide">
        <PageHeader
          title="Timetable"
          subtitle="Your class schedule, always the latest published version."
          actions={
            <div className="hidden items-center gap-2 sm:flex">
              <GhostButton onClick={downloadCsv} disabled={!slots.length}><Download className="h-4 w-4" /> Download</GhostButton>
              <PrimaryButton onClick={() => window.print()} disabled={!slots.length}><Printer className="h-4 w-4" /> Print</PrimaryButton>
            </div>
          }
        />
      </div>

      <div className="print-hide mb-5 grid gap-3 sm:grid-cols-[minmax(0,240px)_minmax(0,200px)_1fr] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Class / Section</span>
          <Select value={classId} disabled><option value={classId}>{classLabel}</option></Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Day</span>
          <Select value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="all">Whole week</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </label>
        <div className="mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)] sm:text-right">
          Last updated: {publishedAt ? new Date(publishedAt).toLocaleString() : "—"}
          {ttQ.data?.published_by_name ? ` · ${ttQ.data.published_by_name}` : ""}
        </div>
        <div className="flex gap-2 sm:hidden">
          <GhostButton className="flex-1" onClick={downloadCsv} disabled={!slots.length}><Download className="h-4 w-4" /> Download</GhostButton>
          <PrimaryButton className="flex-1" onClick={() => window.print()} disabled={!slots.length}><Printer className="h-4 w-4" /> Print</PrimaryButton>
        </div>
      </div>

      {loading ? (
        <LoadingRows rows={4} height={96} />
      ) : meQ.isError ? (
        <ErrorState message={(meQ.error as Error)?.message} onRetry={() => void meQ.refetch()} />
      ) : !student ? (
        <ErrorState message="Your account is not linked to a student profile and class. Please contact the school office." />
      ) : ttQ.isError ? (
        <ErrorState message={(ttQ.error as Error)?.message} onRetry={() => void ttQ.refetch()} />
      ) : !slots.length ? (
        <EmptyState
          icon={CalendarClock}
          title="No published timetable"
          description="Your school hasn't published a timetable for this class yet."
        />
      ) : (
        <section className="timetable-print-area overflow-hidden rounded-[18px] border border-line bg-paper">
          <div className="hidden border-b border-line px-5 py-4 print:block">
            <h1 className="text-2xl font-semibold">Timetable</h1>
            <p className="mt-1 text-sm">{student.full_name} · Academic year {ACADEMIC_YEAR}</p>
          </div>
          <div className="p-3 sm:p-4">
            <TimetableGrid slots={slots} highlightDay={todayDay()} {...(day !== "all" ? { day } : {})} />
          </div>
          <footer className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-[color:var(--ink-soft)] sm:px-5">
            <CalendarClock className="h-4 w-4 shrink-0 text-[color:var(--signal)]" />
            Timetable generated on {publishedAt ? new Date(publishedAt).toLocaleDateString() : "—"}
          </footer>
        </section>
      )}
    </Page>
  );
}
