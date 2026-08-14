import { DAYS, sortSlots, type TimetableSlot } from "@/lib/school-api";
import { TableWrap, Td, Th } from "@/components/portal/ui-kit";
import { cn } from "@/lib/utils";

/** Read-only timetable rendering shared by the student view and editor preview. */
export function TimetableGrid({
  slots,
  highlightDay,
  day,
}: {
  slots: TimetableSlot[];
  highlightDay?: string;
  /** When set, only this day is rendered. */
  day?: string;
}) {
  const days = day ? [day] : (DAYS as readonly string[]);
  const ordered = sortSlots(slots);

  return (
    <div className="space-y-4">
      {days.map((d) => {
        const rows = ordered.filter((s) => s.day === d);
        const periods = rows.filter((s) => !s.is_break);
        const isToday = highlightDay === d;
        return (
          <div
            key={d}
            className={cn(
              "overflow-hidden rounded-[16px] border bg-paper",
              isToday ? "border-[color:var(--signal)]" : "border-line",
            )}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="text-sm font-semibold">{d}</span>
              {isToday && (
                <span className="mono rounded-full bg-[color-mix(in_srgb,var(--signal)_14%,transparent)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--signal)]">
                  Today
                </span>
              )}
              <span className="mono ml-auto text-[10px] uppercase tracking-wider text-[color:var(--ink-soft)]">
                {periods.length} period{periods.length === 1 ? "" : "s"}
              </span>
            </div>

            {rows.length ? (
              <>
                {/* Table on tablet and up */}
                <div className="hidden sm:block">
                  <TableWrap>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <Th>Period</Th>
                          <Th>Time</Th>
                          <Th>Subject</Th>
                          <Th>Teacher</Th>
                          <Th>Room</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) =>
                          s.is_break ? (
                            <tr key={s.id} className="bg-paper-2">
                              <Td className="mono text-[color:var(--ink-soft)]">—</Td>
                              <Td className="mono whitespace-nowrap text-[color:var(--ink-soft)]">
                                {s.start_time} – {s.end_time}
                              </Td>
                              <Td className="font-medium uppercase tracking-wide text-[color:var(--ink-soft)]" colSpan={3}>
                                {s.subject || "Break"}
                              </Td>
                            </tr>
                          ) : (
                            <tr key={s.id}>
                              <Td className="mono">{s.period_no}</Td>
                              <Td className="mono whitespace-nowrap">
                                {s.start_time} – {s.end_time}
                              </Td>
                              <Td className="font-medium">{s.subject || "—"}</Td>
                              <Td>{s.teacher || "—"}</Td>
                              <Td>{s.room || "—"}</Td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </TableWrap>
                </div>

                {/* Stacked cards on phones */}
                <ul className="divide-y divide-[color:var(--line)] sm:hidden">
                  {rows.map((s) =>
                    s.is_break ? (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-3 bg-paper-2 px-4 py-2.5 text-xs uppercase tracking-wide text-[color:var(--ink-soft)]"
                      >
                        <span className="font-medium">{s.subject || "Break"}</span>
                        <span className="mono shrink-0">
                          {s.start_time} – {s.end_time}
                        </span>
                      </li>
                    ) : (
                      <li key={s.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-4 py-3">
                        <span className="mono grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2 text-xs">
                          {s.period_no}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium">{s.subject || "—"}</span>
                            <span className="mono shrink-0 text-[11px] text-[color:var(--ink-soft)]">
                              {s.start_time} – {s.end_time}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-[color:var(--ink-soft)]">
                            {s.teacher || "—"}
                            {s.room ? ` · ${s.room}` : ""}
                          </div>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </>
            ) : (
              <div className="px-4 py-6 text-sm text-[color:var(--ink-soft)]">No periods scheduled.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
