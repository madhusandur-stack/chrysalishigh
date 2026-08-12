import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { EmptyState, ErrorState, LoadingRows, Select } from "@/components/portal/ui-kit";
import { TimetableGrid } from "@/components/portal/timetable-grid";
import {
  ACADEMIC_YEAR,
  DAYS,
  getMyIdentity,
  getTimetable,
  listClasses,
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
  const [classId, setClassId] = useState<string>("");

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const classesQ = useQuery({ queryKey: qk.classes, queryFn: listClasses, staleTime: 300_000 });

  const myClassId = meQ.data?.student?.class_id ?? "";
  useEffect(() => {
    if (!classId && myClassId) setClassId(myClassId);
  }, [myClassId, classId]);

  const ttQ = useQuery({
    queryKey: qk.timetable(classId, ACADEMIC_YEAR),
    queryFn: () => getTimetable(classId, ACADEMIC_YEAR),
    enabled: !!classId,
    // Students always see the latest published version, no hard refresh needed.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const classes = (classesQ.data ?? []) as { id: string; grade: string; section: string }[];
  const slots = useMemo(() => ttQ.data?.published_slots ?? [], [ttQ.data]);
  const publishedAt = ttQ.data?.published_at ?? null;

  const loading = meQ.isLoading || (!!classId && ttQ.isLoading);

  return (
    <Page>
      <PageHeader title="Timetable" subtitle="Your class schedule, always the latest published version." />

      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,240px)_minmax(0,200px)_1fr] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Class / Section</span>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!classes.length}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grade} – {c.section}
              </option>
            ))}
          </Select>
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
      </div>

      {loading ? (
        <LoadingRows rows={4} height={96} />
      ) : ttQ.isError ? (
        <ErrorState message={(ttQ.error as Error)?.message} onRetry={() => void ttQ.refetch()} />
      ) : !slots.length ? (
        <EmptyState
          icon={CalendarClock}
          title="No published timetable"
          description="Your school hasn't published a timetable for this class yet."
        />
      ) : (
        <TimetableGrid
          slots={slots}
          highlightDay={todayDay()}
          {...(day !== "all" ? { day } : {})}
        />
      )}
    </Page>
  );
}
