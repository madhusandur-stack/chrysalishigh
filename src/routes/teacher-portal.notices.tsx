import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Megaphone, Pin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { SmoothInput, SmoothTextarea } from "@/components/ui/smooth-input";

export const Route = createFileRoute("/teacher-portal/notices")({
  component: TeacherNotices,
});

function TeacherNotices() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });

  const noticesQ = useQuery({
    queryKey: ["teacher-notices", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notices")
        .select("id, title, body, pinned, created_at")
        .eq("author_id", user!.id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.campus_id || !form.title.trim()) throw new Error("Title is required.");
      const { error } = await supabase.from("notices").insert({
        author_id: user.id,
        campus_id: profile.campus_id,
        title: form.title.trim(),
        body: form.body.trim() || null,
        pinned: form.pinned,
        audience: "campus",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notice posted");
      setShow(false);
      setForm({ title: "", body: "", pinned: false });
      qc.invalidateQueries({ queryKey: ["teacher-notices"] });
      qc.invalidateQueries({ queryKey: ["teacher-stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["teacher-notices"] });
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Notices"
        title="Notices"
        description="Post announcements for your campus."
        actions={
          <button
            onClick={() => setShow((s) => !s)}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New notice
          </button>
        }
      />

      {show && (
        <div className="mb-6 rounded-[20px] border border-line bg-paper p-6">
          <div className="space-y-3">
            <SmoothInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notice title" />
            <SmoothTextarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What do you want to announce?" />
            <label className="flex items-center gap-2 text-xs text-[color:var(--ink-soft)]">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="h-4 w-4" />
              Pin this notice to the top
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShow(false)} className="rounded-[12px] border border-line bg-paper px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => create.mutate()} disabled={create.isPending} className="rounded-[12px] bg-[color:var(--signal)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {create.isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {noticesQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[16px] bg-paper-2" />)}
        </div>
      ) : (noticesQ.data?.length ?? 0) === 0 ? (
        <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-6 w-6 text-[color:var(--ink-soft)]" />
          <div className="text-sm font-medium">No notices yet</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {noticesQ.data!.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-4 rounded-[16px] border border-line bg-paper p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {n.pinned && <Pin className="h-3.5 w-3.5 text-[color:var(--signal)]" />}
                  <span className="text-sm font-semibold">{n.title}</span>
                </div>
                {n.body && <div className="mt-1 text-sm text-[color:var(--ink-soft)]">{n.body}</div>}
                <div className="mono mt-1 text-[10px] text-[color:var(--ink-soft)]">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              <button
                onClick={() => remove.mutate(n.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[color:var(--ink-soft)] hover:bg-paper-2 hover:text-[color:var(--ember)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
