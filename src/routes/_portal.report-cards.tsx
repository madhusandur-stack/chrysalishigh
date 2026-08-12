import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  SectionCard,
  StatCard,
  StatusPill,
} from "@/components/portal/ui-kit";
import {
  ACADEMIC_YEAR,
  getMyIdentity,
  gradeFor,
  listPupa,
  listReportCards,
  qk,
} from "@/lib/school-api";

export const Route = createFileRoute("/_portal/report-cards")({
  head: () => ({
    meta: [
      { title: "Report Cards — Chrysalis Connect" },
      {
        name: "description",
        content: "Published term report cards with overall grades, plus your teacher's PUPA progress notes.",
      },
      { property: "og:title", content: "Report Cards — Chrysalis Connect" },
      { property: "og:description", content: "Term-wise results and teacher progress observations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportCardsPage,
});

const PUPA_FIELDS = [
  ["strengths", "Strengths"],
  ["improvements", "Areas to improve"],
  ["observations", "Classroom observations"],
  ["parent_support", "How parents can help"],
  ["remarks", "Teacher's remarks"],
] as const;

function ReportCardsPage() {
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  const cardsQ = useQuery({
    queryKey: qk.reportCards(student?.id),
    queryFn: () => listReportCards(student!.id),
    enabled: !!student,
  });
  const pupaQ = useQuery({
    queryKey: qk.pupa(student?.id),
    queryFn: () => listPupa(student!.id),
    enabled: !!student,
  });

  /** Only final PUPA reports are visible to families; drafts stay with the teacher. */
  const pupa = useMemo(() => (pupaQ.data ?? []).filter((p) => p.status === "final"), [pupaQ.data]);
  const cards = cardsQ.data ?? [];
  const best = cards.reduce<number | null>(
    (max, c) => (c.percentage != null && (max == null || c.percentage > max) ? c.percentage : max),
    null,
  );

  const loading = meQ.isLoading || cardsQ.isLoading;

  return (
    <Page>
      <PageHeader title="Report Cards" subtitle={`Term-wise academic performance for ${ACADEMIC_YEAR}.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Published" value={cards.length} />
        <StatCard label="Best term" value={best != null ? `${best}%` : "—"} />
        <StatCard label="Progress notes" value={pupa.length} />
      </div>

      {loading ? (
        <LoadingRows rows={3} height={120} />
      ) : cardsQ.isError ? (
        <ErrorState message={(cardsQ.error as Error)?.message} onRetry={() => void cardsQ.refetch()} />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No report cards yet"
          description="Report cards appear here as soon as the school publishes them."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const grade = c.overall_grade ?? gradeFor(c.percentage).letter;
            return (
              <SectionCard
                key={c.id}
                title={c.term}
                description={
                  c.published_on
                    ? `Published ${new Date(c.published_on).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`
                    : "Awaiting publication"
                }
                actions={<StatusPill status={c.file_url ? "submitted" : "pending"}>{grade}</StatusPill>}
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                      Overall
                    </div>
                    <div className="text-3xl font-semibold tracking-tight">
                      {c.percentage != null ? `${c.percentage}%` : "—"}
                    </div>
                  </div>
                  {c.file_url ? (
                    <a href={c.file_url} target="_blank" rel="noreferrer">
                      <GhostButton as="span">
                        <Download className="h-4 w-4" /> Download
                      </GhostButton>
                    </a>
                  ) : null}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Progress notes (PUPA)</h2>
        {pupaQ.isLoading ? (
          <LoadingRows rows={2} height={110} />
        ) : pupa.length === 0 ? (
          <EmptyState
            title="No progress notes published"
            description="Your class teacher's observations appear here once finalised."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pupa.map((p) => (
              <SectionCard key={p.id} title={p.term} description="Shared by your class teacher">
                <dl className="space-y-3">
                  {PUPA_FIELDS.filter(([key]) => p[key]).map(([key, label]) => (
                    <div key={key}>
                      <dt className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed">{p[key]}</dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
