import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Page, PageHeader } from "@/components/portal/page";
import { EmptyState, ErrorState, LoadingRows } from "@/components/portal/ui-kit";
import { getMyIdentity, listAttendance, qk } from "@/lib/school-api";

export const Route = createFileRoute("/_portal/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Chrysalis Connect" },
      { name: "description", content: "Official school dates published for your class, month by month." },
      { property: "og:title", content: "Calendar — Chrysalis Connect" },
      { property: "og:description", content: "Month view of official school dates and holidays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

/** A calendar entry backed by a real database record. */
type CalEvent = { id: string; date: Date; title: string; kind: string; source: string };

function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;
  const attQ = useQuery({
    queryKey: qk.attendance(student?.id),
    queryFn: () => listAttendance({ studentId: student!.id }),
    enabled: !!student,
  });

  // Only real source today: days the class register marks as a holiday.
  const events = useMemo<CalEvent[]>(
    () =>
      (attQ.data ?? [])
        .filter((r) => ["holiday", "non_school"].includes(r.status.toLowerCase()))
        .map((r) => ({
          id: r.id,
          date: new Date(`${r.date}T00:00:00`),
          title: "School holiday",
          kind: "Holiday",
          source: "Marked in the class attendance register",
        })),
    [attQ.data],
  );

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const eventsFor = (d: Date) => events.filter((e) => isSameDay(e.date, d));
  const monthEvents = events.filter((e) => isSameMonth(e.date, cursor)).sort((a, b) => +a.date - +b.date);
  const selectedEvents = selected ? eventsFor(selected) : [];
  const loading = meQ.isLoading || (!!student && attQ.isLoading);

  return (
    <Page>
      <PageHeader title="Calendar" subtitle="Official school dates for your class." />

      {loading ? (
        <LoadingRows rows={3} height={120} />
      ) : meQ.isError || attQ.isError ? (
        <ErrorState
          message={((meQ.error ?? attQ.error) as Error)?.message}
          onRetry={() => void (meQ.isError ? meQ.refetch() : attQ.refetch())}
        />
      ) : (
        <>
          {events.length === 0 && (
            <div className="mb-4">
              <EmptyState
                icon={CalendarDays}
                title="No school events published yet"
                description="Holidays, exams, PTMs and school events will appear here once the school publishes them."
              />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="card-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-lg font-semibold">{format(cursor, "MMMM yyyy")}</h2>
                <div className="flex gap-1">
                  <IconBtn label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Current month" onClick={() => setCursor(new Date())}>
                    Today
                  </IconBtn>
                  <IconBtn label="Next month" onClick={() => setCursor(addMonths(cursor, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </IconBtn>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 p-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="p-2 text-center text-[10px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]"
                  >
                    {d}
                  </div>
                ))}
                {days.map((d) => {
                  const evts = eventsFor(d);
                  const isSelected = selected && isSameDay(d, selected);
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelected(d)}
                      className={`relative aspect-square rounded-[12px] border p-2 text-left transition ${
                        isSelected
                          ? "border-[color:var(--signal)] bg-[color:var(--signal-soft)]"
                          : evts.length
                            ? "border-dashed border-line bg-paper-2"
                            : "border-transparent hover:border-line hover:bg-paper-2"
                      } ${!isSameMonth(d, cursor) ? "opacity-40" : ""}`}
                    >
                      <div className={`mono text-sm font-medium ${isToday(d) ? "text-[color:var(--signal)]" : ""}`}>
                        {format(d, "d")}
                      </div>
                      {evts.length > 0 && (
                        <div className="absolute bottom-1.5 left-2 right-2 hidden truncate text-[10px] text-[color:var(--ink-soft)] sm:block">
                          {evts[0].kind}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="card-surface min-h-[300px] p-5">
              {selected ? (
                <>
                  <div className="text-lg font-semibold">{format(selected, "EEEE, d MMM yyyy")}</div>
                  <div className="mt-4 space-y-2">
                    {selectedEvents.length === 0 ? (
                      <div className="text-sm text-[color:var(--ink-soft)]">Nothing published for this day.</div>
                    ) : (
                      selectedEvents.map((e) => <EventRow key={e.id} e={e} />)
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold">This month</div>
                  <div className="mt-4 space-y-2">
                    {monthEvents.length === 0 ? (
                      <div className="text-sm text-[color:var(--ink-soft)]">Nothing published this month.</div>
                    ) : (
                      monthEvents.map((e) => <EventRow key={e.id} e={e} showDate />)
                    )}
                  </div>
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </Page>
  );
}

function EventRow({ e, showDate }: { e: CalEvent; showDate?: boolean }) {
  return (
    <div className="border-b border-line pb-2 last:border-0">
      <div className="text-sm font-medium">{e.title}</div>
      <div className="text-xs text-[color:var(--ink-soft)]">
        {showDate ? `${format(e.date, "EEE, d MMM")} · ` : ""}
        {e.source}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 items-center justify-center gap-1 rounded-[10px] border border-line bg-paper px-2.5 text-xs font-medium text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
    >
      {children}
    </button>
  );
}
