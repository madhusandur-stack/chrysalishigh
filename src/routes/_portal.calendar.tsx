import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { events } from "@/lib/mock-data";
import { addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfWeek, addDays, isToday } from "date-fns";

export const Route = createFileRoute("/_portal/calendar")({ component: CalendarPage });

function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const eventsFor = (d: Date) => events.filter((e) => isSameDay(new Date(e.date), d));
  const selectedEvents = selected ? eventsFor(selected) : [];

  return (
    <Page>
      <PageHeader title="Calendar" subtitle="Exams, holidays and school events." />

      <div className="mb-4 flex flex-wrap gap-2">
        {events.slice(0, 4).map((e) => (
          <div key={e.id} className="mono flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px]">
            <span className={`h-2 w-2 rounded-full ${e.type === "exam" ? "bg-[color:var(--violet)]" : "bg-[color:var(--signal)]"}`} />
            <span>{format(new Date(e.date), "d MMM")}</span>
            <span className="text-[color:var(--ink-soft)]">{e.title}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">Month</div>
              <h2 className="text-lg font-semibold">{format(cursor, "MMMM yyyy")}</h2>
            </div>
            <div className="flex gap-1">
              <IconBtn onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="h-4 w-4" /></IconBtn>
              <IconBtn onClick={() => setCursor(new Date())}>Today</IconBtn>
              <IconBtn onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4" /></IconBtn>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 p-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="p-2 text-center text-[10px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">{d}</div>
            ))}
            <AnimatePresence mode="wait">
              <motion.div key={format(cursor, "yyyy-MM")} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="contents">
                {days.map((d) => {
                  const inMonth = isSameMonth(d, cursor);
                  const evts = eventsFor(d);
                  const isSelected = selected && isSameDay(d, selected);
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelected(d)}
                      className={`relative aspect-square rounded-[12px] border p-2 text-left transition ${
                        isSelected
                          ? "border-[color:var(--signal)] bg-[color:var(--signal-soft)]"
                          : "border-transparent hover:border-line hover:bg-paper-2"
                      } ${!inMonth ? "opacity-40" : ""}`}
                    >
                      <div className={`mono text-sm font-medium ${isToday(d) ? "text-[color:var(--signal)]" : ""}`}>{format(d, "d")}</div>
                      <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                        {evts.slice(0, 3).map((e) => (
                          <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${e.type === "exam" ? "bg-[color:var(--violet)]" : "bg-[color:var(--signal)]"}`} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <aside className="card-surface min-h-[300px] p-5">
          <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">Selected</div>
          <div className="mt-1 text-lg font-semibold">{selected ? format(selected, "EEEE, d MMM") : "Pick a day"}</div>
          <div className="mt-4 space-y-2">
            {selectedEvents.length === 0 && selected && (
              <div className="text-sm text-[color:var(--ink-soft)]">No events on this day.</div>
            )}
            {selectedEvents.map((e) => (
              <div key={e.id} className="rounded-[12px] border border-line bg-paper-2 p-3">
                <div className="text-sm font-medium">{e.title}</div>
                <div className="mono text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{e.type}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Page>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex h-8 items-center justify-center gap-1 rounded-[10px] border border-line bg-paper px-2.5 text-xs font-medium text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]">
      {children}
    </button>
  );
}
