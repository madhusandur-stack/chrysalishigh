import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import {
  AttachmentList,
  EmptyState,
  ErrorState,
  LoadingRows,
  SectionCard,
  StatCard,
} from "@/components/portal/ui-kit";
import {
  listHomework,
  listHomeworkTargets,
  getMyIdentity,
  qk,
  type HomeworkItem,
} from "@/lib/school-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_portal/homework")({
  head: () => ({
    meta: [
      { title: "Homework — Chrysalis Connect" },
      {
        name: "description",
        content: "Every assignment for your class with chapters, attachments and due dates.",
      },
      { property: "og:title", content: "Homework — Chrysalis Connect" },
      { property: "og:description", content: "Track assignments and due dates in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeworkPage,
});

function dueLabel(due: string | null) {
  if (!due) return "No due date";
  const days = Math.ceil((+new Date(due) - Date.now()) / 86_400_000);
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function HomeworkPage() {
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

  /** Only assignments for this student: whole-class, or explicitly targeted. */
  const mine = useMemo(() => {
    const targeted = new Set(
      (targetsQ.data ?? []).filter((t) => t.student_id === student?.id).map((t) => t.homework_id),
    );
    return (hwQ.data ?? []).filter(
      (h) => h.status !== "draft" && (h.assign_all || targeted.has(h.id)),
    );
  }, [hwQ.data, targetsQ.data, student?.id]);

  const subjects = useMemo(() => Array.from(new Set(mine.map((h) => h.subject))).sort(), [mine]);

  const filtered = useMemo(
    () => mine.filter((h) => (subject === "all" ? true : h.subject === subject)),
    [mine, subject],
  );

  const overdue = mine.filter(
    (h) => h.due_date && +new Date(h.due_date) < Date.now(),
  ).length;

  const loading = meQ.isLoading || hwQ.isLoading;

  return (
    <Page>
      <PageHeader title="Homework" subtitle="Everything assigned across your subjects." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Assigned" value={mine.length} />
        <StatCard label="Overdue" value={overdue} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
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
          {filtered.map((h) => (
            <SectionCard
              key={h.id}
              title={h.topic || h.subject}
              description={[h.subject, h.chapter].filter(Boolean).join(" · ")}
            >
              {h.description && (
                <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{h.description}</p>
              )}
              <div className="mono mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[color:var(--ink-soft)]">
                <Clock className="h-3.5 w-3.5" /> {dueLabel(h.due_date)}
              </div>
              {h.attachments?.length ? <AttachmentList items={h.attachments} /> : null}
            </SectionCard>
          ))}
        </div>
      )}
    </Page>
  );
}
