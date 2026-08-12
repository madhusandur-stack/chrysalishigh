import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";
import { listCampusUsers, createCampusUser, deleteCampusUser } from "@/lib/staff-admin.functions";
import { PortalPageHeader } from "./coming-soon";

type Role = "student" | "teacher";

export function UserManager({ role, title, eyebrow, description }: { role: Role; title: string; eyebrow: string; description: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listCampusUsers);
  const createFn = useServerFn(createCampusUser);
  const deleteFn = useServerFn(deleteCampusUser);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const key = ["staff-users", role, search] as const;

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listFn({ data: { role, search } }),
    staleTime: 15_000,
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createFn({ data: { ...payload, role } }),
    onSuccess: () => {
      toast.success(`${role === "student" ? "Student" : "Teacher"} created.`);
      qc.invalidateQueries({ queryKey: ["staff-users", role] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("User removed.");
      qc.invalidateQueries({ queryKey: ["staff-users", role] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add {role}
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-[14px] border border-line bg-paper px-3 py-2">
        <Search className="h-4 w-4 text-[color:var(--ink-soft)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${role}s by name${role === "student" ? " or ID" : ""}…`}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--ink-soft)]"
        />
      </div>

      <div className="rounded-[20px] border border-line bg-paper">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-[10px] bg-paper-2" />)}
          </div>
        ) : (data?.users?.length ?? 0) === 0 ? (
          <div className="p-10 text-center text-sm text-[color:var(--ink-soft)]">
            No {role}s yet. Click "Add {role}" to create one.
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data!.users.map((u: any) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{u.full_name ?? "Unnamed"}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[color:var(--ink-soft)]">
                    {role === "student" && u.student_id ? <span className="mono">{u.student_id}</span> : null}
                    {u.grade ? <span>Grade {u.grade}</span> : null}
                    {u.house ? <span>{u.house}</span> : null}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${u.full_name}? This deletes their account.`)) deleteMut.mutate(u.id);
                  }}
                  disabled={deleteMut.isPending}
                  className="rounded-[10px] border border-line p-2 text-[color:var(--ink-soft)] hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialogOpen ? <CreateDialog role={role} onClose={() => setDialogOpen(false)} onSubmit={(v) => createMut.mutate(v)} pending={createMut.isPending} /> : null}
    </div>
  );
}

function CreateDialog({ role, onClose, onSubmit, pending }: { role: Role; onClose: () => void; onSubmit: (v: any) => void; pending: boolean }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [house, setHouse] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-[20px] border border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold tracking-tight">Add {role}</h3>
        <p className="mt-1 text-xs text-[color:var(--ink-soft)]">Creates an account and assigns the campus role.</p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              fullName,
              email,
              password,
              studentId: role === "student" ? (studentId || undefined) : undefined,
              grade: grade || undefined,
              house: role === "student" ? (house || undefined) : undefined,
            });
          }}
        >
          <Field label="Full name"><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></Field>
          <Field label="Email"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
          <Field label="Temporary password"><input required minLength={8} type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Min 8 characters" /></Field>
          {role === "student" ? (
            <>
              <Field label="Student ID (optional)"><input value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Grade"><input value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls} placeholder="e.g. X-A" /></Field>
                <Field label="House"><input value={house} onChange={(e) => setHouse(e.target.value)} className={inputCls} /></Field>
              </div>
            </>
          ) : (
            <Field label="Subject / Grade (optional)"><input value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls} /></Field>
          )}
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
