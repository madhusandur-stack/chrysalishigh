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
                {rows.length} period{rows.length === 1 ? "" : "s"}
              </span>
            </div>
            {rows.length ? (
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
                    {rows.map((s) => (
                      <tr key={s.id}>
                        <Td className="mono">{s.period_no}</Td>
                        <Td className="mono whitespace-nowrap">
                          {s.start_time} – {s.end_time}
                        </Td>
                        <Td className="font-medium">{s.subject || "—"}</Td>
                        <Td>{s.teacher || "—"}</Td>
                        <Td>{s.room || "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <div className="px-4 py-6 text-sm text-[color:var(--ink-soft)]">No periods scheduled.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
