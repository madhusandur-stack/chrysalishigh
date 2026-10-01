import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Search } from "lucide-react";
import { toast } from "sonner";
import { listClasses, listStudents, type Student } from "@/lib/school-api";
import { uploadStudentPhoto } from "@/lib/student-photo.functions";
import { EmptyState, ErrorState, LoadingRows } from "@/components/portal/ui-kit";

export const Route = createFileRoute("/teacher-portal/students")({
  head: () => ({
    meta: [
      { title: "Student Roster — Chrysalis Connect" },
      { name: "description", content: "View students and upload their profile photos." },
      { property: "og:title", content: "Student Roster — Chrysalis Connect" },
      { property: "og:description", content: "View students and upload their profile photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RosterPage,
});

function RosterPage() {
  const studentsQ = useQuery({ queryKey: ["roster", "students"], queryFn: listStudents });
  const classesQ = useQuery({ queryKey: ["roster", "classes"], queryFn: listClasses });
  const [classId, setClassId] = useState("all");
  const [q, setQ] = useState("");

  const classLabel = useMemo(() => {
    const m = new Map<string, string>();
    (classesQ.data ?? []).forEach((c) => m.set(c.id, `${c.grade}-${c.section}`));
    return m;
  }, [classesQ.data]);

  const rows = (studentsQ.data ?? []).filter(
    (s) => (classId === "all" || s.class_id === classId) && s.full_name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Student roster</h1>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">Upload a photo and students will see it on their profile.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-[12px] border border-line bg-paper px-3 py-2">
          <Search className="h-4 w-4 text-[color:var(--ink-soft)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-[12px] border border-line bg-paper px-3 py-2 text-sm">
          <option value="all">All classes</option>
          {(classesQ.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
          ))}
        </select>
      </div>
      {studentsQ.isLoading ? (
        <LoadingRows rows={4} height={72} />
      ) : studentsQ.isError ? (
        <ErrorState message={(studentsQ.error as Error).message} onRetry={() => void studentsQ.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Search} title="No students found" description="Try another class or search." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <StudentRow key={s.id} student={s} label={classLabel.get(s.class_id) ?? "—"} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentRow({ student, label }: { student: Student; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = useServerFn(uploadStudentPhoto);
  const qc = useQueryClient();

  async function onFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Use a JPG, PNG or WebP image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Photo must be under 5 MB");
    setBusy(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      await upload({ data: { studentId: student.id, mime: file.type as "image/png", base64: btoa(bin) } });
      toast.success(`Photo updated for ${student.full_name}`);
      await qc.invalidateQueries({ queryKey: ["roster", "students"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-line bg-paper p-3 shadow-card">
      {student.photo_url ? (
        <img src={student.photo_url} alt={student.full_name} className="h-12 w-12 rounded-[12px] object-cover" />
      ) : (
        <div className="grid h-12 w-12 place-items-center rounded-[12px] bg-[color:var(--signal-soft)] text-sm font-semibold text-[color:var(--signal)]">
          {student.full_name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{student.full_name}</div>
        <div className="text-xs text-[color:var(--ink-soft)]">{label} · Roll {student.roll_no}</div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-xs font-medium hover:bg-paper-2 disabled:opacity-60"
      >
        <Camera className="h-4 w-4" /> {busy ? "Uploading…" : student.photo_url ? "Change" : "Upload"}
      </button>
    </div>
  );
}
