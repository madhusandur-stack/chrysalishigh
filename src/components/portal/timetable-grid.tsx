import { sortSlots, timetableDays, type TimetableSettings, type TimetableSlot } from "@/lib/school-api";
import { cn } from "@/lib/utils";

type GridColumn = {
  key: string;
  period_no: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  label: string;
};

function isBreak(slot: TimetableSlot) {
  return Boolean(slot.is_break || /break|snack|lunch/i.test(slot.subject));
}

function columnKey(slot: TimetableSlot) {
  return `${slot.start_time}-${slot.end_time}-${isBreak(slot) ? "break" : slot.period_no}`;
}

/** Read-only timetable rendering shared by the student view and editor preview. */
export function TimetableGrid({
  slots,
  highlightDay,
  day,
  settings,
}: {
  slots: TimetableSlot[];
  highlightDay?: string;
  /** When set, only this day is rendered. */
  day?: string;
  /** Class-level timetable settings, e.g. whether Saturday is enabled. */
  settings?: TimetableSettings | null;
}) {
  const all = sortSlots(slots);
  const days = day ? [day] : timetableDays(all, settings);
  // Breaks are shared columns; ordinary periods only show for rendered days.
  const ordered = all.filter((slot) => isBreak(slot) || days.includes(slot.day));
  const columns = Array.from(
    ordered.reduce((map, slot) => {
      const key = columnKey(slot);
      if (!map.has(key)) {
        map.set(key, {
          key,
          period_no: slot.period_no,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_break: isBreak(slot),
          label: slot.subject || "Break",
        });
      }
      return map;
    }, new Map<string, GridColumn>()).values(),
  ).sort((a, b) => a.start_time.localeCompare(b.start_time) || a.period_no - b.period_no);

  return (
    <div className="timetable-grid">
      <div className="hidden overflow-x-auto rounded-[16px] border border-line bg-paper md:block">
        <table className="w-full min-w-[980px] table-fixed border-collapse text-center">
          <thead>
            <tr>
              <th className="w-24 border-b border-r border-line bg-paper-2 px-3 py-4 text-sm font-semibold text-[color:var(--signal)]">Day</th>
              {columns.map((column) => (
                <th key={column.key} className={cn("border-b border-r border-line px-2 py-3 last:border-r-0", column.is_break ? "w-20 bg-paper-2" : "min-w-28 bg-paper-2")}>
                  <div className="text-xs font-semibold">{column.is_break ? "Break" : `Period ${column.period_no}`}</div>
                  <div className="mono mt-1 whitespace-nowrap text-[9px] font-normal text-[color:var(--ink-soft)]">{column.start_time} – {column.end_time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const daySlots = ordered.filter((slot) => slot.day === d);
              const isToday = highlightDay === d;
              const firstDay = days[0] === d;
              return (
                <tr key={d} className={cn(isToday && "bg-[color:var(--signal-soft)]")}>
                  <th scope="row" className="border-b border-r border-line px-3 py-5 text-sm font-semibold last:border-b-0">
                    {d}
                    {isToday && <span className="mono mt-1 block text-[8px] uppercase text-[color:var(--signal)]">Today</span>}
                  </th>
                  {columns.map((column) => {
                    const slot = column.is_break
                      ? ordered.find((item) => columnKey(item) === column.key)
                      : daySlots.find((item) => columnKey(item) === column.key);
                    if (column.is_break) {
                      if (!firstDay) return null;
                      return (
                        <td
                          key={column.key}
                          rowSpan={days.length}
                          className="border-b border-r border-line bg-paper-2/70 px-1 py-3 align-middle last:border-r-0"
                        >
                          <span className="mx-auto block whitespace-nowrap text-[9px] font-semibold uppercase text-[color:var(--ink-soft)] [writing-mode:vertical-rl] rotate-180">
                            {slot?.subject || column.label}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={column.key} className="h-20 border-b border-r border-line px-2 py-3 align-middle last:border-r-0">
                        {slot ? (
                          <div className="mx-auto max-w-36">
                            <div className="text-xs font-semibold leading-snug">{slot.subject || "—"}</div>
                            <div className="mt-1 text-[9px] leading-snug text-[color:var(--ink-soft)]">{slot.teacher || "Teacher not assigned"}</div>
                          </div>
                        ) : <span className="text-[color:var(--ink-soft)]">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {days.map((d) => {
          const breaks = ordered.filter((slot) => isBreak(slot));
          const rows = [...ordered.filter((slot) => !isBreak(slot) && slot.day === d), ...breaks.map((b) => ({ ...b, day: d }))].sort(
            (a, b) => a.start_time.localeCompare(b.start_time),
          );
          const isToday = highlightDay === d;
          return (
            <section key={d} className={cn("overflow-hidden rounded-[16px] border bg-paper", isToday ? "border-[color:var(--signal)]" : "border-line")}>
              <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-line px-4 py-3">
                <h3 className="truncate text-sm font-semibold">{d}</h3>
                <span className="mono text-[9px] uppercase text-[color:var(--ink-soft)]">{isToday ? "Today" : `${rows.filter((s) => !isBreak(s)).length} periods`}</span>
              </header>
              {rows.length ? (
                <ul className="divide-y divide-[color:var(--line)]">
                  {rows.map((slot) => isBreak(slot) ? (
                    <li key={slot.id} className="flex items-center justify-between gap-3 bg-paper-2 px-4 py-2.5 text-xs text-[color:var(--ink-soft)]">
                      <span className="font-semibold uppercase">{slot.subject || "Break"}</span>
                      <span className="mono shrink-0 text-[10px]">{slot.start_time} – {slot.end_time}</span>
                    </li>
                  ) : (
                    <li key={slot.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-4 py-3">
                      <span className="mono grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--signal-soft)] text-xs text-[color:var(--signal)]">{slot.period_no}</span>
                      <div className="min-w-0">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                          <span className="truncate text-sm font-semibold">{slot.subject || "—"}</span>
                          <span className="mono shrink-0 text-[10px] text-[color:var(--ink-soft)]">{slot.start_time} – {slot.end_time}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[color:var(--ink-soft)]">{slot.teacher || "Teacher not assigned"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="px-4 py-6 text-sm text-[color:var(--ink-soft)]">No periods scheduled.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
