import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import {
  ACADEMIC_YEAR,
  DAYS,
  SUBJECTS,
  getTimetable,
  listClasses,
  listStaff,
  publishTimetable,
  qk,
  saveTimetableDraft,
  sortSlots,
  todayDay,
  type Timetable,
  type TimetableSlot,
} from "@/lib/school-api";
import { Field, GhostButton, PrimaryButton, Select, StatusPill, TextInput } from "@/components/portal/ui-kit";
import { TimetableGrid } from "@/components/portal/timetable-grid";
import { cn } from "@/lib/utils";

const YEARS = [ACADEMIC_YEAR, "2025-26", "2027-28"];

function uid() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function nextSlot(day: string, existing: TimetableSlot[]): TimetableSlot {
  const forDay = existing.filter((s) => s.day === day).sort((a, b) => a.period_no - b.period_no);
  const last = forDay[forDay.length - 1];
  return {
    id: uid(),
    day,
    period_no: (last?.period_no ?? 0) + 1,
    start_time: last?.end_time ?? "08:00",
    end_time: last ? addMinutes(last.end_time, 45) : "08:45",
    subject: "",
    teacher: "",
    room: last?.room ?? "",
  };
}

function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(":").map((n) => Number(n) || 0);
  const total = (h ?? 0) * 60 + (m ?? 0) + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Full timetable management surface — shared by the Teacher and Admin portals. */
export function TimetableEditor({ editorName }: { editorName: string }) {
  const qc = useQueryClient();
  const [classId, setClassId] = useState<string>("");
  const [year, setYear] = useState<string>(ACADEMIC_YEAR);
  const [day, setDay] = useState<string>(todayDay());
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [copyTo, setCopyTo] = useState<string>("");

  const classesQ = useQuery({ queryKey: qk.classes, queryFn: listClasses, staleTime: 300_000 });
  const staffQ = useQuery({ queryKey: qk.staff, queryFn: listStaff, staleTime: 300_000 });

  const classes = (classesQ.data ?? []) as { id: string; grade: string; section: string }[];

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0]!.id);
  }, [classes, classId]);

  const ttQ = useQuery({
    queryKey: qk.timetable(classId, year),
    queryFn: () => getTimetable(classId, year),
    enabled: !!classId,
  });

  useEffect(() => {
    setSlots(sortSlots(ttQ.data?.draft_slots ?? []));
    setDirty(false);
  }, [ttQ.data]);

  const daySlots = useMemo(
    () => slots.filter((s) => s.day === day).sort((a, b) => a.period_no - b.period_no),
    [slots, day],
  );

  function update(id: string, patch: Partial<TimetableSlot>) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setDirty(true);
  }

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setDirty(true);
  }

  function move(id: string, dir: -1 | 1) {
    const ordered = [...daySlots];
    const i = ordered.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    const a = ordered[i]!;
    const b = ordered[j]!;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === a.id) return { ...s, period_no: b.period_no, start_time: b.start_time, end_time: b.end_time };
        if (s.id === b.id) return { ...s, period_no: a.period_no, start_time: a.start_time, end_time: a.end_time };
        return s;
      }),
    );
    setDirty(true);
  }

  function copyDay(target: string) {
    if (!target || target === day) return;
    const copied = daySlots.map((s) => ({ ...s, id: uid(), day: target }));
    setSlots((prev) => [...prev.filter((s) => s.day !== target), ...copied]);
    setDirty(true);
    toast.success(`Copied ${day} → ${target}`);
  }

  const saveDraft = useMutation({
    mutationFn: () => saveTimetableDraft({ classId, academicYear: year, slots: sortSlots(slots), editorName }),
    onSuccess: () => {
      toast.success("Draft saved");
      setDirty(false);
      qc.invalidateQueries({ queryKey: qk.timetable(classId, year) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: () => publishTimetable({ classId, academicYear: year, slots: sortSlots(slots), editorName }),
    onSuccess: () => {
      toast.success("Published — students now see this timetable");
      setDirty(false);
      qc.invalidateQueries({ queryKey: qk.timetable(classId, year) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tt: Timetable | null = ttQ.data ?? null;
  const publishedDiffers =
    JSON.stringify(sortSlots(tt?.published_slots ?? [])) !== JSON.stringify(sortSlots(slots));

  const teachers = (staffQ.data ?? []).map((s) => s.full_name);
  const rooms = Array.from(new Set(slots.map((s) => s.room).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-3 rounded-[18px] border border-line bg-paper p-4 sm:grid-cols-3">
        <Field label="Class / Section">
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grade} – {c.section}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Academic year">
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Day">
          <Select value={day} onChange={(e) => setDay(e.target.value)}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-paper px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--ink-soft)]">
          <StatusPill status={dirty || publishedDiffers ? "pending" : "present"}>
            {dirty ? "Unsaved changes" : publishedDiffers ? "Draft ahead of published" : "Published"}
          </StatusPill>
          <span>
            Last updated:{" "}
            {tt?.updated_at ? new Date(tt.updated_at).toLocaleString() : "—"}
            {tt?.updated_by_name ? ` · by ${tt.updated_by_name}` : ""}
          </span>
          <span>
            Published: {tt?.published_at ? new Date(tt.published_at).toLocaleString() : "not yet"}
            {tt?.published_by_name ? ` · by ${tt.published_by_name}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={() => setPreview((p) => !p)}>
            <Eye className="h-4 w-4" /> {preview ? "Back to editor" : "Preview"}
          </GhostButton>
          <GhostButton onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending || !classId}>
            {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
          </GhostButton>
          <PrimaryButton onClick={() => publish.mutate()} disabled={publish.isPending || !classId}>
            {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish
          </PrimaryButton>
        </div>
      </div>

      {ttQ.isLoading ? (
        <div className="h-40 animate-pulse rounded-[18px] bg-paper-2" />
      ) : preview ? (
        <div className="rounded-[18px] border border-line bg-paper p-5">
          <div className="mb-3 text-sm font-semibold">Preview — what students will see once published</div>
          <TimetableGrid slots={slots} highlightDay={todayDay()} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    day === d
                      ? "border-[color:var(--signal)] bg-[color:var(--signal)] text-white"
                      : "border-line bg-paper text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
                  )}
                >
                  {d}
                  <span className="mono ml-1.5 opacity-70">
                    {slots.filter((s) => s.day === d).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={copyTo}
                onChange={(e) => setCopyTo(e.target.value)}
                className="w-auto"
                aria-label="Copy this day to"
              >
                <option value="">Copy {day} to…</option>
                {DAYS.filter((d) => d !== day).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <GhostButton
                onClick={() => {
                  copyDay(copyTo);
                  setCopyTo("");
                }}
                disabled={!copyTo}
              >
                <Copy className="h-4 w-4" /> Copy
              </GhostButton>
            </div>
          </div>

          <div className="space-y-3">
            {daySlots.map((s, i) => (
              <div key={s.id} className="rounded-[16px] border border-line bg-paper p-4">
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-1">
                    <Field label="Period">
                      <TextInput
                        type="number"
                        min={1}
                        value={s.period_no}
                        onChange={(e) => update(s.id, { period_no: Number(e.target.value) || 1 })}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Start">
                      <TextInput type="time" value={s.start_time} onChange={(e) => update(s.id, { start_time: e.target.value })} />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="End">
                      <TextInput type="time" value={s.end_time} onChange={(e) => update(s.id, { end_time: e.target.value })} />
                    </Field>
                  </div>
                  <div className="md:col-span-3">
                    <Field label="Subject">
                      <TextInput
                        list="tt-subjects"
                        value={s.subject}
                        onChange={(e) => update(s.id, { subject: e.target.value })}
                        placeholder="Select or type"
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Teacher">
                      <TextInput
                        list="tt-teachers"
                        value={s.teacher}
                        onChange={(e) => update(s.id, { teacher: e.target.value })}
                        placeholder="Select or type"
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Room">
                      <TextInput
                        list="tt-rooms"
                        value={s.room}
                        onChange={(e) => update(s.id, { room: e.target.value })}
                        placeholder="R-101"
                      />
                    </Field>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-1">
                  <IconBtn label="Move up" onClick={() => move(s.id, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Move down" onClick={() => move(s.id, 1)} disabled={i === daySlots.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Delete period" onClick={() => removeSlot(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </div>
            ))}

            {!daySlots.length && (
              <div className="rounded-[16px] border border-dashed border-line bg-paper p-8 text-center text-sm text-[color:var(--ink-soft)]">
                No periods for {day} yet.
              </div>
            )}

            <GhostButton
              onClick={() => {
                setSlots((prev) => [...prev, nextSlot(day, prev)]);
                setDirty(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add period
            </GhostButton>
          </div>
        </div>
      )}

      <datalist id="tt-subjects">
        {SUBJECTS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="tt-teachers">
        {teachers.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <datalist id="tt-rooms">
        {rooms.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </div>
  );
}

function IconBtn({
  children,
  label,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-full border border-line text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
