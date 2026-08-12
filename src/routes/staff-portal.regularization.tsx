import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, FileText, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import {
  EmptyState,
  ErrorState,
  Field,
  GhostButton,
  LoadingRows,
  PrimaryButton,
  SectionCard,
  Select,
  StatCard,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/portal/ui-kit";
import { listRegularizations, listStaff, qk, updateRegularization } from "@/lib/school-api";

export const Route = createFileRoute("/staff-portal/regularization")({
  head: () => ({
    meta: [
      { title: "Regularization Approvals — Chrysalis Staff Portal" },
      {
        name: "description",
        content: "Review teacher attendance regularization requests and approve, decline or ask for more information.",
      },
      { property: "og:title", content: "Regularization Approvals — Chrysalis Staff Portal" },
      { property: "og:description", content: "Approve or decline teacher attendance regularization requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegularizationApprovals,
});

const FILTERS = ["pending", "approved", "declined", "info_requested", "all"] as const;

function RegularizationApprovals() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const staffQ = useQuery({ queryKey: qk.staff, queryFn: listStaff, staleTime: 300_000 });
  const listQ = useQuery({ queryKey: qk.regularization, queryFn: () => listRegularizations() });

  const staffById = useMemo(() => new Map((staffQ.data ?? []).map((s) => [s.id, s])), [staffQ.data]);

  const decide = useMutation({
    mutationFn: (v: { id: string; status: string; hr_note: string | null }) =>
      updateRegularization(v.id, { status: v.status, hr_note: v.hr_note }),
    onSuccess: (_d, v) => {
      toast.success(
        v.status === "approved"
          ? "Request approved — the teacher will see the update"
          : v.status === "declined"
            ? "Request declined"
            : "More information requested",
      );
      void qc.invalidateQueries({ queryKey: qk.regularization });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the request"),
  });

  const rows = listQ.data ?? [];

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, declined: 0, info_requested: 0 };
    for (const r of rows) if (r.status in c) c[r.status as keyof typeof c] += 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      const name = staffById.get(r.staff_id)?.full_name ?? "";
      return name.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q) || r.date.includes(q);
    });
  }, [rows, filter, search, staffById]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Regularization approvals"
        description="Teacher-raised attendance corrections. Decisions and notes flow straight back to the teacher's portal."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending" value={counts.pending} />
        <StatCard label="Approved" value={counts.approved} />
        <StatCard label="Declined" value={counts.declined} />
        <StatCard label="Info requested" value={counts.info_requested} />
      </div>

      <SectionCard title="Filters" description="Filter by decision status or search by teacher, reason or date.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f === "all" ? "All requests" : f.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Search">
            <TextInput
              placeholder="Teacher, reason or date"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="mt-5 space-y-4">
        {listQ.isLoading ? (
          <LoadingRows rows={3} height={120} />
        ) : listQ.isError ? (
          <ErrorState message={(listQ.error as Error)?.message} onRetry={() => void listQ.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing to review"
            description="Regularization requests raised by teachers appear here."
          />
        ) : (
          filtered.map((r) => {
            const teacher = staffById.get(r.staff_id);
            const pending = r.status === "pending" || r.status === "info_requested";
            const note = notes[r.id] ?? r.hr_note ?? "";
            return (
              <SectionCard
                key={r.id}
                title={`${teacher?.full_name ?? "Teacher"} — ${new Date(r.date).toLocaleDateString()}`}
                description={`${r.reason} · raised ${new Date(r.created_at).toLocaleDateString()}`}
                actions={<StatusPill status={r.status}>{r.status.replace("_", " ")}</StatusPill>}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--ink-soft)]">
                  {r.explanation}
                </p>

                {r.document_url && (
                  <a
                    href={r.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-medium transition hover:bg-paper-2"
                  >
                    <FileText className="h-3.5 w-3.5" /> Supporting document
                  </a>
                )}

                {r.email_body && (
                  <details className="mt-3 rounded-[14px] border border-line bg-paper-2/50 p-3">
                    <summary className="cursor-pointer text-xs font-medium">View request sent to HR</summary>
                    <pre className="mono mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-[color:var(--ink-soft)]">
                      {r.email_body}
                    </pre>
                  </details>
                )}

                <div className="mt-4 border-t border-line pt-4">
                  <Field label="HR note (shared with the teacher)">
                    <TextArea
                      value={note}
                      readOnly={!pending}
                      placeholder="Optional note explaining the decision or the information needed."
                      onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                    />
                  </Field>

                  {pending && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <PrimaryButton
                        loading={decide.isPending}
                        onClick={() => decide.mutate({ id: r.id, status: "approved", hr_note: note || null })}
                      >
                        <Check className="h-4 w-4" /> Approve
                      </PrimaryButton>
                      <GhostButton
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ id: r.id, status: "declined", hr_note: note || null })}
                      >
                        <X className="h-4 w-4" /> Decline
                      </GhostButton>
                      <GhostButton
                        disabled={decide.isPending}
                        onClick={() => {
                          if (!note.trim()) {
                            toast.error("Add a note describing the information you need.");
                            return;
                          }
                          decide.mutate({ id: r.id, status: "info_requested", hr_note: note });
                        }}
                      >
                        <HelpCircle className="h-4 w-4" /> Request more info
                      </GhostButton>
                    </div>
                  )}
                </div>
              </SectionCard>
            );
          })
        )}
      </div>
    </div>
  );
}
