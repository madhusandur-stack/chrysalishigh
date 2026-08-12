import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Clock, ShieldQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { SmoothInput } from "@/components/ui/smooth-input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher-portal/attendance")({
  component: TeacherAttendance,
});

type Status = "present" | "absent" | "late" | "excused";

const STATUSES: { key: Status; label: string; icon: typeof Check; tone: string }[] = [
  { key: "present", label: "P", icon: Check, tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  { key: "absent", label: "A", icon: X, tone: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
  { key: "late", label: "L", icon: Clock, tone: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { key: "excused", label: "E", icon: ShieldQuestion, tone: "text-sky-500 bg-sky-500/10 border-sky-500/30" },
];

function TeacherAttendance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const classesQ = useQuery({
    queryKey: ["teacher-classes-min", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("teacher_assignments")
        .select("class_id, classes(id, grade, section)")
        .eq("teacher_id", user!.id);
      return data ?? [];
    },
  });

  const rosterQ = useQuery({
    queryKey: ["class-roster", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .eq("class_id", classId);
      const ids = (enrollments ?? []).map((e) => e.student_id);
      if (ids.length === 0) return [] as { student_id: string; full_name: string | null; student_number: string | null }[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, student_id")
        .in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return ids.map((id) => {
        const p = map.get(id);
        return { student_id: id, full_name: p?.full_name ?? null, student_number: p?.student_id ?? null };
      });
    },
  });

  const recordsQ = useQuery({
    queryKey: ["attendance", classId, date],
    enabled: !!classId && !!date,
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_records")
        .select("student_id, status")
        .eq("class_id", classId)
        .eq("date", date);
      return data ?? [];
    },
  });

  const statusMap = useMemo(() => {
    const map = new Map<string, Status>();
    (recordsQ.data ?? []).forEach((r) => map.set(r.student_id, r.status as Status));
    return map;
  }, [recordsQ.data]);

  const mark = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: Status }) => {
      if (!user) return;
      const { error } = await supabase.from("attendance_records").upsert(
        { class_id: classId, student_id: studentId, date, status, marked_by: user.id },
        { onConflict: "class_id,student_id,date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance", classId, date] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const bulkMark = async (status: Status) => {
    if (!rosterQ.data || rosterQ.data.length === 0) return;
    await Promise.all(rosterQ.data.map((r) => mark.mutateAsync({ studentId: r.student_id, status })));
    toast.success(`Marked ${rosterQ.data.length} students`);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader eyebrow="Attendance" title="Mark attendance" description="Select a class and date, then tap the status buttons." />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="h-12 rounded-[14px] border border-line bg-paper px-3 text-sm outline-none focus:border-[color:var(--signal)]"
        >
          <option value="">Select a class…</option>
          {(classesQ.data ?? []).map((c) => {
            const cls = c.classes as { grade: string; section: string } | null;
            return (
              <option key={c.class_id} value={c.class_id}>
                {cls?.grade} · {cls?.section}
              </option>
            );
          })}
        </select>
        <SmoothInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {classId && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => bulkMark("present")} className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium hover:bg-paper-2">Mark all Present</button>
          <button onClick={() => bulkMark("absent")} className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium hover:bg-paper-2">Mark all Absent</button>
        </div>
      )}

      {!classId ? (
        <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center text-sm text-[color:var(--ink-soft)]">
          Choose a class to view its roster.
        </div>
      ) : rosterQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-[12px] bg-paper-2" />
          ))}
        </div>
      ) : (rosterQ.data?.length ?? 0) === 0 ? (
        <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center text-sm text-[color:var(--ink-soft)]">
          No students enrolled in this class yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {rosterQ.data!.map((row) => {
            const current = statusMap.get(row.student_id);
            return (
              <li key={row.student_id} className="flex items-center justify-between rounded-[14px] border border-line bg-paper px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium">{row.full_name ?? "Student"}</div>
                  <div className="mono text-xs text-[color:var(--ink-soft)]">{row.student_number ?? row.student_id.slice(0, 8)}</div>
                </div>
                <div className="flex gap-1.5">
                  {STATUSES.map((s) => {
                    const active = current === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => mark.mutate({ studentId: row.student_id, status: s.key })}
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold transition",
                          active ? s.tone : "border-line text-[color:var(--ink-soft)] hover:bg-paper-2",
                        )}
                        aria-label={s.key}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
