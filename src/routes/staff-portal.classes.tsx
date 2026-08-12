import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, School, Users } from "lucide-react";
import { listCampusClasses, createClass, deleteClass } from "@/lib/staff-admin.functions";
import { PortalPageHeader } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/staff-portal/classes")({
  component: ClassesPage,
});

function ClassesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCampusClasses);
  const createFn = useServerFn(createClass);
  const deleteFn = useServerFn(deleteClass);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-classes"],
    queryFn: () => listFn({ data: {} }),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createFn({ data: payload }),
    onSuccess: () => {
      toast.success("Class created.");
      qc.invalidateQueries({ queryKey: ["staff-classes"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (classId: string) => deleteFn({ data: { classId } }),
    onSuccess: () => {
      toast.success("Class deleted.");
      qc.invalidateQueries({ queryKey: ["staff-classes"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Classes"
        description="Create grade/section groups. Assign teachers and enroll students from here."
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add class
          </button>
        }
      />

      <div className="rounded-[20px] border border-line bg-paper">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-[10px] bg-paper-2" />)}
          </div>
        ) : (data?.classes?.length ?? 0) === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-paper-2"><School className="h-4 w-4 text-[color:var(--ink-soft)]" /></div>
            <div className="text-sm text-[color:var(--ink-soft)]">No classes yet. Click "Add class" to create one.</div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data!.classes.map((c: any) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[color:var(--signal-soft)]">
                    <School className="h-4 w-4 text-[color:var(--signal)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">Grade {c.grade} · Section {c.section}</div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-[color:var(--ink-soft)]">
                      {c.subject ? <span>{c.subject}</span> : null}
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.student_count}</span>
                      {c.teacher_name ? <span>Teacher: {c.teacher_name}</span> : <span>No teacher assigned</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm(`Delete Grade ${c.grade} · ${c.section}?`)) deleteMut.mutate(c.id); }}
                  disabled={deleteMut.isPending}
                  className="rounded-[10px] border border-line p-2 text-[color:var(--ink-soft)] hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialogOpen ? <CreateClassDialog onClose={() => setDialogOpen(false)} onSubmit={(v) => createMut.mutate(v)} pending={createMut.isPending} /> : null}
    </div>
  );
}

function CreateClassDialog({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (v: any) => void; pending: boolean }) {
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-[20px] border border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold tracking-tight">Add class</h3>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => { e.preventDefault(); onSubmit({ grade, section, subject: subject || undefined }); }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grade"><input required value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls} placeholder="e.g. 10" /></Field>
            <Field label="Section"><input required value={section} onChange={(e) => setSection(e.target.value)} className={inputCls} placeholder="e.g. A" /></Field>
          </div>
          <Field label="Subject (optional)"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="e.g. Homeroom" /></Field>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-[12px] border border-line px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-[10px] border border-line bg-paper-2 px-3 py-2 text-sm outline-none focus:border-[color:var(--signal)]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-[color:var(--ink-soft)]">{label}</div>
      {children}
    </label>
  );
}
