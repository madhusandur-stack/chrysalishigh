import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Download, FileText, Megaphone, NotebookPen, Printer } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import {
  AttachmentList,
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
  listHomework,
  listHomeworkStatus,
  listHomeworkTargets,
  listNotices,
  listPupa,
  listReportCards,
  noticesForStudent,
  qk,
} from "@/lib/school-api";

export const Route = createFileRoute("/_portal/diary")({
  head: () => ({
    meta: [
      { title: "Diary — Chrysalis Connect" },
      {
        name: "description",
        content:
          "Your school diary: report cards, assigned homework, notices from teachers and admin, and published PUPA progress notes.",
      },
      { property: "og:title", content: "Diary — Chrysalis Connect" },
      {
        property: "og:description",
        content: "Report cards, homework, notices and PUPA progress notes in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiaryPage,
});

const TABS = [
  { key: "report-cards", label: "Report cards", icon: FileText },
  { key: "homework", label: "Homework", icon: BookOpen },
  { key: "notices", label: "Notices", icon: Megaphone },
  { key: "pupa", label: "PUPA summary", icon: NotebookPen },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PUPA_FIELDS = [
  ["strengths", "Strengths"],
  ["improvements", "Areas to improve"],
  ["observations", "Classroom observations"],
  ["parent_support", "How parents can help"],
  ["remarks", "Teacher's remarks"],
] as const;

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function DiaryPage() {
  const [tab, setTab] = useState<TabKey>("report-cards");

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
  const hwQ = useQuery({
    queryKey: [...qk.homework, student?.class_id],
    queryFn: () => listHomework(student!.class_id),
    enabled: !!student,
  });
  const statusQ = useQuery({
    queryKey: qk.homeworkStatus(student?.id),
    queryFn: () => listHomeworkStatus(student!.id),
    enabled: !!student,
  });
  const targetsQ = useQuery({
    queryKey: ["school", "homework-targets", student?.class_id],
    queryFn: () => listHomeworkTargets((hwQ.data ?? []).map((h) => h.id)),
    enabled: !!student && !!hwQ.data?.length,
  });
  const noticesQ = useQuery({ queryKey: qk.notices, queryFn: listNotices });

  const cards = cardsQ.data ?? [];
  /** Drafts stay with the teacher; families only ever see finalised PUPA reports. */
  const pupa = useMemo(() => (pupaQ.data ?? []).filter((p) => p.status === "final"), [pupaQ.data]);

  const homework = useMemo(() => {
    const items = hwQ.data ?? [];
    const targets = targetsQ.data ?? [];
    if (!student) return [];
    return items.filter(
      (h) => h.assign_all || targets.some((t) => t.homework_id === h.id && t.student_id === student.id),
    );
  }, [hwQ.data, targetsQ.data, student]);

  const statusFor = (id: string) =>
    (statusQ.data ?? []).find((s) => s.homework_id === id)?.status ?? "pending";

  const notices = useMemo(
    () => noticesForStudent(noticesQ.data ?? [], student),
    [noticesQ.data, student],
  );

  const loading = meQ.isLoading;

  return (
    <Page>
      <PageHeader
        title="Diary"
        subtitle={`Report cards, homework, notices and progress notes for ${ACADEMIC_YEAR}.`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Report cards" value={cards.length} />
        <StatCard label="Homework" value={homework.length} />
        <StatCard label="Notices" value={notices.length} />
        <StatCard label="Progress notes" value={pupa.length} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-[color:var(--signal)] bg-[color:var(--signal)]/10 text-[color:var(--signal)]"
                  : "border-line text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingRows rows={3} height={110} />
      ) : (
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {tab === "report-cards" && (
            <ReportCardsTab
              cards={cards}
              loading={cardsQ.isLoading}
              error={cardsQ.isError ? (cardsQ.error as Error)?.message : undefined}
              onRetry={() => void cardsQ.refetch()}
            />
          )}

          {tab === "homework" && (
            <>
              {hwQ.isLoading ? (
                <LoadingRows rows={3} height={100} />
              ) : hwQ.isError ? (
                <ErrorState message={(hwQ.error as Error)?.message} onRetry={() => void hwQ.refetch()} />
              ) : homework.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No homework assigned"
                  description="Work set by your teachers will show up here with due dates and attachments."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {homework.map((h) => (
                    <SectionCard
                      key={h.id}
                      title={`${h.subject}${h.topic ? ` · ${h.topic}` : ""}`}
                      description={[h.chapter, h.due_date ? `Due ${fmtDate(h.due_date)}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                      actions={<StatusPill status={statusFor(h.id)}>{statusFor(h.id)}</StatusPill>}
                    >
                      {h.description ? (
                        <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{h.description}</p>
                      ) : null}
                      <AttachmentList items={h.attachments ?? []} />
                    </SectionCard>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "notices" && (
            <>
              {noticesQ.isLoading ? (
                <LoadingRows rows={3} height={100} />
              ) : noticesQ.isError ? (
                <ErrorState
                  message={(noticesQ.error as Error)?.message}
                  onRetry={() => void noticesQ.refetch()}
                />
              ) : notices.length === 0 ? (
                <EmptyState
                  icon={Megaphone}
                  title="No notices yet"
                  description="Announcements from your teachers and the school office appear here."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {notices.map((n) => (
                    <SectionCard
                      key={n.id}
                      title={n.title}
                      description={`${n.author_name ?? "School"} · ${fmtDate(n.published_at)}`}
                      actions={n.pinned ? <StatusPill status="pinned">Pinned</StatusPill> : null}
                    >
                      {n.body ? (
                        <p className="whitespace-pre-line text-sm leading-relaxed text-[color:var(--ink-soft)]">
                          {n.body}
                        </p>
                      ) : null}
                      <AttachmentList items={n.attachments ?? []} />
                    </SectionCard>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "pupa" && (
            <>
              {pupaQ.isLoading ? (
                <LoadingRows rows={2} height={120} />
              ) : pupa.length === 0 ? (
                <EmptyState
                  icon={NotebookPen}
                  title="No progress notes published"
                  description="Your class teacher's PUPA report becomes visible once it is submitted as final."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {pupa.map((p) => (
                    <SectionCard
                      key={p.id}
                      title={p.term}
                      description={`Shared by your class teacher · ${fmtDate(p.submitted_at)}`}
                    >
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
            </>
          )}
        </motion.div>
      )}
    </Page>
  );
}

function ReportCardsTab({
  cards,
  loading,
  error,
  onRetry,
}: {
  cards: Awaited<ReturnType<typeof listReportCards>>;
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  if (loading) return <LoadingRows rows={3} height={120} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (cards.length === 0)
    return (
      <EmptyState
        icon={FileText}
        title="No report cards yet"
        description="Term 1, Term 2 and final report cards appear here as soon as they are published."
      />
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => {
        const grade = c.overall_grade ?? gradeFor(c.percentage).letter;
        return (
          <SectionCard
            key={c.id}
            title={c.term}
            description={c.published_on ? `Published ${fmtDate(c.published_on)}` : "Awaiting publication"}
            actions={<StatusPill status={c.file_url ? "submitted" : "pending"}>{grade}</StatusPill>}
          >
            <div className="text-3xl font-semibold tracking-tight">
              {c.percentage != null ? `${c.percentage}%` : "—"}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.file_url ? (
                <>
                  <a href={c.file_url} target="_blank" rel="noreferrer">
                    <GhostButton as="span">
                      <FileText className="h-4 w-4" /> View
                    </GhostButton>
                  </a>
                  <a href={c.file_url} download target="_blank" rel="noreferrer">
                    <GhostButton as="span">
                      <Download className="h-4 w-4" /> Download
                    </GhostButton>
                  </a>
                  <GhostButton onClick={() => window.open(c.file_url!, "_blank")?.print()}>
                    <Printer className="h-4 w-4" /> Print
                  </GhostButton>
                </>
              ) : (
                <span className="text-xs text-[color:var(--ink-soft)]">File not uploaded yet.</span>
              )}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
