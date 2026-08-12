import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  ProgressBar,
  SectionCard,
  TextInput,
} from "@/components/portal/ui-kit";
import { listLessonPlans, qk, updatePlanTopic } from "@/lib/school-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher-portal/planner")({
  head: () => ({
    meta: [
      { title: "Academic Planner — Chrysalis Teacher Portal" },
      { name: "description", content: "Track syllabus coverage chapter by chapter and mark topics complete." },
      { property: "og:title", content: "Academic Planner — Chrysalis Teacher Portal" },
      { property: "og:description", content: "Chapter-wise syllabus tracking with completion progress." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const plansQ = useQuery({ queryKey: qk.planner, queryFn: () => listLessonPlans() });

  const update = useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof updatePlanTopic>[1] }) => updatePlanTopic(v.id, v.patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.planner }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the topic"),
  });

  const plans = plansQ.data ?? [];
  const overall = useMemo(() => {
    const topics = plans.flatMap((p) => p.lesson_plan_topics);
    const done = topics.filter((t) => t.completed).length;
    return { done, total: topics.length, pct: topics.length ? (done / topics.length) * 100 : 0 };
  }, [plans]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PortalPageHeader
        eyebrow="Academic Planner"
        title="Syllabus coverage"
        description="Chapter-wise plans per subject. Tick topics as you cover them and add remarks for delays."
      />

      <SectionCard className="mb-6" title="Overall progress" description={`${overall.done} of ${overall.total} topics covered`}>
        <ProgressBar value={overall.pct} label="Syllabus completed" />
      </SectionCard>

      {plansQ.isLoading ? (
        <LoadingRows rows={4} height={64} />
      ) : plansQ.isError ? (
        <ErrorState message={(plansQ.error as Error)?.message} onRetry={() => void plansQ.refetch()} />
      ) : plans.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No lesson plans yet" description="Plans appear here once created for your class." />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const topics = [...plan.lesson_plan_topics].sort((a, b) => a.sort_order - b.sort_order);
            const done = topics.filter((t) => t.completed).length;
            const pct = topics.length ? (done / topics.length) * 100 : 0;
            const expanded = open === plan.id;
            return (
              <div key={plan.id} className="overflow-hidden rounded-[20px] border border-line bg-paper">
                <button
                  onClick={() => setOpen(expanded ? null : plan.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-paper-2/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold tracking-tight">{plan.subject}</div>
                    <div className="mt-2">
                      <ProgressBar value={pct} label={`${done}/${topics.length} topics`} />
                    </div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")} />
                </button>

                {expanded && (
                  <ul className="divide-y divide-line border-t border-line">
                    {topics.map((t) => (
                      <li key={t.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          aria-label={`Mark ${t.topic} complete`}
                          className="mt-1 h-4 w-4 rounded border-line accent-[color:var(--signal)]"
                          onChange={(e) =>
                            update.mutate({
                              id: t.id,
                              patch: {
                                completed: e.target.checked,
                                completed_on: e.target.checked ? new Date().toISOString().slice(0, 10) : null,
                              },
                            })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className={cn("text-sm font-medium", t.completed && "text-[color:var(--ink-soft)] line-through")}>
                            {t.topic}
                          </div>
                          <div className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                            {t.chapter}
                            {t.expected_date ? ` · expected ${new Date(t.expected_date).toLocaleDateString()}` : ""}
                            {t.completed_on ? ` · done ${new Date(t.completed_on).toLocaleDateString()}` : ""}
                          </div>
                          <TextInput
                            defaultValue={t.remarks ?? ""}
                            placeholder="Remarks (optional)"
                            className="mt-2"
                            onBlur={(e) => {
                              if (e.target.value !== (t.remarks ?? "")) {
                                update.mutate({ id: t.id, patch: { remarks: e.target.value || null } });
                              }
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
