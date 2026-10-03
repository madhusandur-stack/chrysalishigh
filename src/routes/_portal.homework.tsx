import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import {
  AttachmentList,
  EmptyState,
  ErrorState,
  LoadingRows,
  SectionCard,
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

function dayKey(due: string | null) {
  return due ? new Date(due).toDateString() : "no-date";
}

function dayLabel(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((+day - +today) / 86_400_000);
  const base = d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return base;
}

function daySub(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((+day - +today) / 86_400_000);
  const base = d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (diff === 0) return `Today · ${base}`;
  if (diff === 1) return `Tomorrow · ${base}`;
  return base;
}

/** Compact per-row due date: relative wording near today, plain date otherwise. */
function dueLabel(due: string | null) {
  if (!due) return "—";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(due);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((+day - +today) / 86_400_000);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return day.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(day.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
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

  /** Homework grouped by due date, soonest first; undated items go last. */
  const days = useMemo(() => {
    const map = new Map<string, HomeworkItem[]>();
    for (const h of filtered) {
      const key = dayKey(h.due_date);
      const list = map.get(key) ?? [];
      list.push(h);
      map.set(key, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => {
        if (a === "no-date") return 1;
        if (b === "no-date") return -1;
        return +new Date(a) - +new Date(b);
      })
      .map(([key, items]) => ({
        key,
        date: key === "no-date" ? null : new Date(key),
        items: [...items].sort((a, b) => a.subject.localeCompare(b.subject)),
      }));
  }, [filtered]);

  const loading = meQ.isLoading || hwQ.isLoading;

  return (
    <Page>
      <PageHeader title="Homework" subtitle="What your class teacher has assigned, day by day." />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button
            onClick={() => setSubject("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              subject === "all"
                ? "border-[color:var(--ink)] text-[color:var(--ink)]"
                : "border-line text-[color:var(--ink-soft)]",
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
                subject === s
                  ? "border-[color:var(--ink)] text-[color:var(--ink)]"
                  : "border-line text-[color:var(--ink-soft)]",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingRows rows={5} height={72} />
      ) : hwQ.isError ? (
        <ErrorState message={(hwQ.error as Error)?.message} onRetry={() => void hwQ.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing here"
          description="No homework matches the selected filters right now."
        />
      ) : (
        <div className="space-y-4">
          {days.map(({ key, date, items }) => (
            <SectionCard
              key={key}
              title={date ? dayLabel(date) : "No due date"}
              description={date ? daySub(date) : undefined}
              bodyClassName="px-5 py-2 sm:px-6"
            >
              <ul className="divide-y divide-line">
                {items.map((h) => (
                  <li
                    key={h.id}
                    className="grid gap-1 py-3.5 sm:grid-cols-[150px_1fr_130px] sm:items-start sm:gap-5"
                  >
                    <div className="flex items-baseline justify-between gap-3 sm:block">
                      <span className="mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--signal)]">
                        {h.subject}
                      </span>
                      <span className="text-xs font-medium text-[color:var(--ink-soft)] sm:hidden">
                        {dueLabel(h.due_date)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      {h.chapter && (
                        <p className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                          {h.chapter}
                        </p>
                      )}
                      {h.topic && <p className="text-sm font-semibold tracking-tight">{h.topic}</p>}
                      {h.description && (
                        <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--ink-soft)]">
                          {h.description}
                        </p>
                      )}
                      {h.attachments?.length ? <AttachmentList items={h.attachments} /> : null}
                    </div>
                    <span className="hidden text-right text-xs font-medium text-[color:var(--ink-soft)] sm:block">
                      {dueLabel(h.due_date)}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}
        </div>
      )}
    </Page>
  );
}
