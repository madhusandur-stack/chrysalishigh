import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Megaphone, Pin } from "lucide-react";
import { listCampusNotices, createNotice, deleteNotice } from "@/lib/staff-admin.functions";
import { PortalPageHeader } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/staff-portal/notices")({
  component: NoticesPage,
});

function NoticesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCampusNotices);
  const createFn = useServerFn(createNotice);
  const deleteFn = useServerFn(deleteNotice);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-notices"],
    queryFn: () => listFn({ data: {} }),
    staleTime: 15_000,
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createFn({ data: payload }),
    onSuccess: () => {
      toast.success("Notice posted.");
      qc.invalidateQueries({ queryKey: ["staff-notices"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (noticeId: string) => deleteFn({ data: { noticeId } }),
    onSuccess: () => {
      toast.success("Notice removed.");
      qc.invalidateQueries({ queryKey: ["staff-notices"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Notices"
        description="Publish campus-wide announcements. Pin important ones to the top."
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New notice
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[16px] bg-paper-2" />)}
        </div>
      ) : (data?.notices?.length ?? 0) === 0 ? (
        <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-paper-2"><Megaphone className="h-4 w-4 text-[color:var(--ink-soft)]" /></div>
          <div className="text-sm text-[color:var(--ink-soft)]">No notices yet.</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {data!.notices.map((n: any) => (
            <li key={n.id} className="rounded-[16px] border border-line bg-paper p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {n.pinned ? <Pin className="h-3.5 w-3.5 text-[color:var(--ember)]" /> : null}
                    <h3 className="text-base font-semibold tracking-tight">{n.title}</h3>
                  </div>
                  {n.body ? <p className="mt-1.5 whitespace-pre-wrap text-sm text-[color:var(--ink-soft)]">{n.body}</p> : null}
                  <div className="mt-3 flex items-center gap-3 text-xs text-[color:var(--ink-soft)]">
                    <span className="mono uppercase tracking-wider">{n.audience}</span>
                    <span>·</span>
                    <span>{n.author_name}</span>
                    <span>·</span>
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm(`Delete "${n.title}"?`)) deleteMut.mutate(n.id); }}
                  disabled={deleteMut.isPending}
                  className="rounded-[10px] border border-line p-2 text-[color:var(--ink-soft)] hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialogOpen ? <CreateNoticeDialog onClose={() => setDialogOpen(false)} onSubmit={(v) => createMut.mutate(v)} pending={createMut.isPending} /> : null}
    </div>
  );
}

function CreateNoticeDialog({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (v: any) => void; pending: boolean }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"campus" | "students" | "teachers" | "parents">("campus");
  const [pinned, setPinned] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[20px] border border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold tracking-tight">New notice</h3>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => { e.preventDefault(); onSubmit({ title, body: body || undefined, audience, pinned }); }}
        >
          <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
          <Field label="Body"><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className={`${inputCls} resize-y`} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Audience">
              <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className={inputCls}>
                <option value="campus">Entire campus</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Pin to top
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-[12px] border border-line px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish
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
