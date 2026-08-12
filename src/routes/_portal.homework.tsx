import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/portal/page";
import {
  AttachmentList,
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PrimaryButton,
  SectionCard,
  StatCard,
  StatusPill,
} from "@/components/portal/ui-kit";
import {
  listHomework,
  listHomeworkStatus,
  listHomeworkTargets,
  getMyIdentity,
  qk,
  setHomeworkStatus,
  type HomeworkItem,
} from "@/lib/school-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_portal/homework")({
  head: () => ({
    meta: [
      { title: "Homework — Chrysalis Connect" },
      {
        name: "description",
        content: "Every assignment for your class with chapters, attachments, due dates and submission status.",
      },
      { property: "og:title", content: "Homework — Chrysalis Connect" },
      { property: "og:description", content: "Track assignments, due dates and submissions in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeworkPage,
});

const FILTERS = ["all", "pending", "submitted"] as const;

function dueLabel(due: string | null) {
  if (!due) return "No due date";
  const days = Math.ceil((+new Date(due) - Date.now()) / 86_400_000);
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function HomeworkPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [subject, setSubject] = useState("all");

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  const hwQ = useQuery({
    queryKey: [...qk.homework, student?.class_id ?? "none"],
    queryFn: () => listHomework(student?.class_id),
    enabled: !!student,
  });
  const targetsQ = useQuery({
    queryKey: ["school", "homework-targets", (hwQ.data ?? []).length],
    queryFn: () => listHomeworkTargets((hwQ.data ?? []).map((h) => h.id)),
    enabled: !!hwQ.data?.length,
  });
  const statusQ = useQuery({
    queryKey: qk.homeworkStatus(student?.id),
    queryFn: () => listHomeworkStatus(student?.id),
    enabled: !!student,
  });

  const submit = useMutation({
    mutationFn: (input: { homework_id: string; status: "pending" | "submitted" }) =>
      setHomeworkStatus({ ...input, student_id: student!.id }),
    onSuccess: (_d, v) => {
      toast.success(v.status === "submitted" ? "Marked as submitted" : "Moved back to pending");
      void qc.invalidateQueries({ queryKey: qk.homeworkStatus(student?.id) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Only assignments for this student: whole-class, or explicitly targeted. */
  const mine = useMemo(() => {
    const targeted = new Set(
      (targetsQ.data ?? []).filter((t) => t.student_id === student?.id).map((t) => t.homework_id),
    );
    return (hwQ.data ?? []).filter(
      (h) => h.status !== "draft" && (h.assign_all || targeted.has(h.id)),
    );
  }, [hwQ.data, targetsQ.data, student?.id]);

  const statusOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of statusQ.data ?? []) map.set(s.homework_id, s.status);
    return (h: HomeworkItem) => map.get(h.id) ?? "pending";
  }, [statusQ.data]);

  const subjects = useMemo(() => Array.from(new Set(mine.map((h) => h.subject))).sort(), [mine]);

  const filtered = useMemo(
    () =>
      mine
        .filter((h) => (filter === "all" ? true : statusOf(h) === filter))
        .filter((h) => (subject === "all" ? true : h.subject === subject)),
    [mine, filter, subject, statusOf],
  );

  const pendingCount = mine.filter((h) => statusOf(h) === "pending").length;
  const overdue = mine.filter(
    (h) => statusOf(h) === "pending" && h.due_date && +new Date(h.due_date) < Date.now(),
  ).length;

  const loading = meQ.isLoading || hwQ.isLoading || statusQ.isLoading;

  return (
    <Page>
      <PageHeader title="Homework" subtitle="Everything assigned across your subjects." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Assigned" value={mine.length} />
        <StatCard label="Pending" value={pendingCount} />
        <StatCard label="Submitted" value={mine.length - pendingCount} />
        <StatCard label="Overdue" value={overdue} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition",
              filter === f
                ? "border-[color:var(--signal)] bg-[color:var(--signal)] text-white"
                : "border-line bg-paper text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
            )}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button
            onClick={() => setSubject("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              subject === "all" ? "border-[color:var(--ink)] text-[color:var(--ink)]" : "border-line text-[color:var(--ink-soft)]",
            )}
          >
            All subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                subject === s ? "border-[color:var(--ink)] text-[color:var(--ink)]" : "border-line text-[color:var(--ink-soft)]",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingRows rows={5} height={96} />
      ) : hwQ.isError ? (
        <ErrorState message={(hwQ.error as Error)?.message} onRetry={() => void hwQ.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing here"
          description="No homework matches the selected filters right now."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((h) => {
            const st = statusOf(h);
            const done = st === "submitted";
            return (
              <SectionCard
                key={h.id}
                title={h.topic || h.subject}
                description={[h.subject, h.chapter].filter(Boolean).join(" · ")}
                actions={<StatusPill status={done ? "submitted" : "pending"}>{st}</StatusPill>}
              >
                {h.description && (
                  <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{h.description}</p>
                )}
                <div className="mono mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[color:var(--ink-soft)]">
                  <Clock className="h-3.5 w-3.5" /> {dueLabel(h.due_date)}
                </div>
                {h.attachments?.length ? <AttachmentList items={h.attachments} /> : null}
                <div className="mt-4">
                  {done ? (
                    <GhostButton
                      disabled={submit.isPending}
                      onClick={() => submit.mutate({ homework_id: h.id, status: "pending" })}
                    >
                      Undo submission
                    </GhostButton>
                  ) : (
                    <PrimaryButton
                      disabled={submit.isPending}
                      onClick={() => submit.mutate({ homework_id: h.id, status: "submitted" })}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark as submitted
                    </PrimaryButton>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </Page>
  );
}
