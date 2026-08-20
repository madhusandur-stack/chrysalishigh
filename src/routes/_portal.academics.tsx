import { useMemo, useState } from "react";
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
  ProgressBar,
  SectionCard,
  Select,
  StatCard,
  StatusPill,
  TableWrap,
  Td,
  Th,
} from "@/components/portal/ui-kit";
import {
  ACADEMIC_YEAR,
  getMyIdentity,
  gradeFor,
  listCce,
  listPupa,
  listReportCards,
  overallPercentage,
  qk,
  subjectPercentage,
  TERMS,
} from "@/lib/school-api";

export const Route = createFileRoute("/_portal/academics")({
  head: () => ({
    meta: [
      { title: "Academics — Chrysalis Connect" },
      {
        name: "description",
        content: "CCE assessment marks, subject-wise grades and co-scholastic ratings for the current academic year.",
      },
      { property: "og:title", content: "Academics — Chrysalis Connect" },
      { property: "og:description", content: "Subject-wise CCE marks, grades and co-scholastic ratings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademicsPage,
});

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

function AcademicsPage() {
  const [term, setTerm] = useState<string>(TERMS[0]);

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  const cceQ = useQuery({
    queryKey: qk.cce(student?.id),
    queryFn: () => listCce(student!.id),
    enabled: !!student,
  });

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

  const cards = cardsQ.data ?? [];
  /** Only final PUPA reports are visible to families; drafts stay with the teacher. */
  const pupa = useMemo(() => (pupaQ.data ?? []).filter((p) => p.status === "final"), [pupaQ.data]);


  const rows = useMemo(
    () => (cceQ.data?.scholastic ?? []).filter((r) => r.term === term),
    [cceQ.data, term],
  );
  const co = useMemo(
    () => (cceQ.data?.coScholastic ?? []).find((r) => r.term === term) ?? null,
    [cceQ.data, term],
  );

  const overall = overallPercentage(rows);
  const grade = gradeFor(overall);
  const isTerm1 = term === "Term 1";
  const loading = meQ.isLoading || cceQ.isLoading;

  return (
    <Page>
      <PageHeader
        title="Academics"
        subtitle={`CCE assessment record for ${ACADEMIC_YEAR}.`}
        actions={
          <div className="w-40">
            <Field label="Term">
              <Select value={term} onChange={(e) => setTerm(e.target.value)}>
                {TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Subjects assessed" value={rows.length} />
        <StatCard label="Overall" value={overall != null ? `${overall}%` : "—"} />
        <StatCard label="Grade" value={grade.letter} />
        <StatCard label="Grade points" value={grade.points || "—"} />
      </div>

      <SectionCard
        title={`Scholastic — ${term}`}
        description="Formative assessments are out of 20 each; the summative is out of 100 and scaled to 60."
      >
        {loading ? (
          <LoadingRows rows={6} />
        ) : cceQ.isError ? (
          <ErrorState message={(cceQ.error as Error)?.message} onRetry={() => void cceQ.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No marks published yet"
            description="Your teachers will publish assessment marks for this term soon."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>{isTerm1 ? "FA 1" : "FA 3"}</Th>
                <Th>{isTerm1 ? "FA 2" : "FA 4"}</Th>
                <Th>{isTerm1 ? "SA 1" : "SA 2"}</Th>
                <Th>Total</Th>
                <Th>Grade</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = subjectPercentage(r);
                return (
                  <tr key={r.id}>
                    <Td className="font-medium">{r.subject}</Td>
                    <Td>{(isTerm1 ? r.fa1 : r.fa3) ?? "—"}</Td>
                    <Td>{(isTerm1 ? r.fa2 : r.fa4) ?? "—"}</Td>
                    <Td>{(isTerm1 ? r.sa1 : r.sa2) ?? "—"}</Td>
                    <Td>{pct != null ? `${pct}%` : "—"}</Td>
                    <Td>{gradeFor(pct).letter}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </SectionCard>

      {rows.length > 0 && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <SectionCard title="Subject performance" description="Term totals at a glance.">
            <div className="space-y-4">
              {rows.map((r) => (
                <ProgressBar key={r.id} value={subjectPercentage(r) ?? 0} label={r.subject} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title={`Co-scholastic — ${term}`} description="Grades awarded by your class teacher.">
            {co ? (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CO_FIELDS.map(([key, label]) => (
                  <div key={key} className="rounded-[14px] border border-line bg-paper-2/50 p-3">
                    <dt className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                      {label}
                    </dt>
                    <dd className="mt-1 text-lg font-semibold">{co[key] ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <EmptyState
                title="Not graded yet"
                description="Co-scholastic grades appear once your class teacher submits them."
              />
            )}
          </SectionCard>
        </div>
      )}
    </Page>
  );
}
