import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, GraduationCap } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import {
  EmptyState,
  ErrorState,
  Field,
  GhostButton,
  LoadingRows,
  SectionCard,
  Select,
  TableWrap,
  Td,
  Th,
} from "@/components/portal/ui-kit";
import { getMyIdentity, listCce, listPupa, listReportCards, qk } from "@/lib/school-api";

export const Route = createFileRoute("/_portal/academics")({
  head: () => ({
    meta: [
      { title: "Academics & Results — Chrysalis Connect" },
      {
        name: "description",
        content: "Published assessment marks by academic year and term, report cards and teacher progress notes.",
      },
      { property: "og:title", content: "Academics & Results — Chrysalis Connect" },
      {
        property: "og:description",
        content: "Published marks, report cards and progress notes for students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademicsPage,
});

/** Assessment columns exactly as recorded by the school — no weightage or scaling applied. */
const ASSESSMENTS = [
  ["fa1", "FA 1"],
  ["fa2", "FA 2"],
  ["sa1", "SA 1"],
  ["fa3", "FA 3"],
  ["fa4", "FA 4"],
  ["sa2", "SA 2"],
] as const;

const CO_FIELDS = [
  ["discipline", "Discipline"],
  ["art_education", "Art education"],
  ["work_education", "Work education"],
  ["health_pe", "Health & PE"],
  ["life_skills", "Life skills"],
  ["values_grade", "Values"],
  ["participation", "Participation"],
] as const;

const PUPA_FIELDS = [
  ["strengths", "Strengths"],
  ["improvements", "Areas to improve"],
  ["observations", "Classroom observations"],
  ["parent_support", "How parents can help"],
  ["remarks", "Teacher's remarks"],
] as const;

type Row = Record<string, unknown> & { id: string; subject: string; term: string; academic_year: string };
const fmtDate = (d: string) =>
  new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function AcademicsPage() {
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  const cceQ = useQuery({ queryKey: qk.cce(student?.id), queryFn: () => listCce(student!.id), enabled: !!student });
  const cardsQ = useQuery({
    queryKey: qk.reportCards(student?.id),
    queryFn: () => listReportCards(student!.id),
    enabled: !!student,
  });
  const pupaQ = useQuery({ queryKey: qk.pupa(student?.id), queryFn: () => listPupa(student!.id), enabled: !!student });

  // Database access rules already return only published rows for students; filter again defensively.
  const sch = useMemo(
    () => ((cceQ.data?.scholastic ?? []) as unknown as Row[]).filter((r) => r.published_at),
    [cceQ.data],
  );
  const co = useMemo(
    () => ((cceQ.data?.coScholastic ?? []) as unknown as Row[]).filter((r) => r.published_at),
    [cceQ.data],
  );
  const cards = cardsQ.data ?? [];
  const pupa = useMemo(() => (pupaQ.data ?? []).filter((p) => p.status === "final"), [pupaQ.data]);

  const years = useMemo(() => {
    const s = new Set<string>();
    [...sch, ...co].forEach((r) => s.add(r.academic_year));
    cards.forEach((c) => s.add(c.academic_year));
    pupa.forEach((p) => s.add(p.academic_year));
    return [...s].sort().reverse();
  }, [sch, co, cards, pupa]);

  const [year, setYear] = useState<string>("");
  useEffect(() => {
    if (!year && years[0]) setYear(years[0]);
  }, [years, year]);

  const yearSch = sch.filter((r) => r.academic_year === year);
  const yearCo = co.filter((r) => r.academic_year === year);
  const yearCards = cards.filter((c) => c.academic_year === year);
  const yearPupa = pupa.filter((p) => p.academic_year === year);
  const terms = [...new Set([...yearSch, ...yearCo].map((r) => r.term)), ...yearCards.map((c) => c.term)]
    .filter((t, i, a) => a.indexOf(t) === i)
    .sort();

  const loading = meQ.isLoading || (!!student && (cceQ.isLoading || cardsQ.isLoading || pupaQ.isLoading));
  const err = meQ.error ?? cceQ.error ?? cardsQ.error ?? pupaQ.error;

  return (
    <Page>
      <PageHeader
        title="Academics"
        subtitle="Published results, report cards and progress notes."
        actions={
          years.length > 0 ? (
            <div className="w-40">
              <Field label="Academic year">
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingRows rows={5} height={90} />
      ) : err ? (
        <ErrorState message={(err as Error).message} onRetry={() => void cceQ.refetch()} />
      ) : !student ? (
        <EmptyState
          icon={GraduationCap}
          title="No student record linked"
          description="Your account isn't linked to a student record yet. Please contact the school office."
        />
      ) : years.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No results published yet"
          description="Marks, report cards and progress notes appear here once the school publishes them."
        />
      ) : (
        <>
          {/* Summary — counts only, no derived grades */}
          <div className="card-surface mb-6 flex flex-wrap gap-x-8 gap-y-2 p-4 text-sm">
            <Summary label="Academic year" value={year} />
            <Summary label="Terms with results" value={terms.length} />
            <Summary label="Subjects assessed" value={new Set(yearSch.map((r) => r.subject)).size} />
            <Summary label="Report cards" value={yearCards.length} />
          </div>

          <div className="space-y-6">
            {terms.map((term) => {
              const rows = yearSch.filter((r) => r.term === term);
              const cols = ASSESSMENTS.filter(([k]) => rows.some((r) => r[k] != null));
              const coRow = yearCo.find((r) => r.term === term);
              const card = yearCards.find((c) => c.term === term);
              return (
                <SectionCard
                  key={term}
                  title={term}
                  description={card?.published_on ? `Report card published ${fmtDate(card.published_on)}` : undefined}
                  actions={
                    card?.file_url ? (
                      <a href={card.file_url} target="_blank" rel="noreferrer">
                        <GhostButton as="span">
                          <Download className="h-4 w-4" /> Report card
                        </GhostButton>
                      </a>
                    ) : undefined
                  }
                >
                  {card && (card.percentage != null || card.overall_grade) && (
                    <p className="mb-4 text-sm">
                      <span className="text-[color:var(--ink-soft)]">Result issued by school: </span>
                      <span className="font-semibold">
                        {[card.percentage != null ? `${card.percentage}%` : null, card.overall_grade]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </p>
                  )}

                  {rows.length === 0 ? (
                    <p className="text-sm text-[color:var(--ink-soft)]">No subject marks published for this term.</p>
                  ) : (
                    <TableWrap>
                      <thead>
                        <tr>
                          <Th>Subject</Th>
                          {cols.map(([k, l]) => (
                            <Th key={k}>{l}</Th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id}>
                            <Td className="font-medium">{r.subject}</Td>
                            {cols.map(([k]) => (
                              <Td key={k} className="mono">
                                {(r[k] as number | null) ?? "—"}
                              </Td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  )}

                  {coRow && (
                    <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {CO_FIELDS.filter(([k]) => coRow[k]).map(([k, l]) => (
                        <div key={k} className="rounded-[12px] border border-line p-2.5">
                          <dt className="text-[11px] text-[color:var(--ink-soft)]">{l}</dt>
                          <dd className="font-semibold">{String(coRow[k])}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </SectionCard>
              );
            })}
            {terms.length === 0 && (
              <EmptyState icon={FileText} title="No term results for this year" description="Nothing published yet." />
            )}
          </div>

          {yearPupa.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Progress notes (PUPA)</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {yearPupa.map((p) => (
                  <SectionCard key={p.id} title={p.term} description="Shared by your class teacher">
                    <dl className="space-y-3">
                      {PUPA_FIELDS.filter(([k]) => p[k]).map(([k, l]) => (
                        <div key={k}>
                          <dt className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{l}</dt>
                          <dd className="mt-1 text-sm leading-relaxed">{p[k]}</dd>
                        </div>
                      ))}
                    </dl>
                  </SectionCard>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Page>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
