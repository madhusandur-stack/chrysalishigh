import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, FileText, Megaphone, NotebookPen } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { AttachmentList, EmptyState, ErrorState, LoadingRows } from "@/components/portal/ui-kit";
import {
  getMyIdentity,
  listNotices,
  listPupa,
  listReportCards,
  noticesForStudent,
  qk,
  type Attachment,
} from "@/lib/school-api";

export const Route = createFileRoute("/_portal/diary")({
  head: () => ({
    meta: [
      { title: "Diary — Chrysalis Connect" },
      {
        name: "description",
        content: "A dated record of notices, teacher progress notes and published report cards.",
      },
      { property: "og:title", content: "Diary — Chrysalis Connect" },
      { property: "og:description", content: "Notices, progress notes and report cards in date order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiaryPage,
});

type Kind = "notice" | "pupa" | "report";
type Entry = {
  id: string;
  kind: Kind;
  at: Date;
  title: string;
  by: string;
  body?: string | null;
  fields?: [string, string][];
  attachments?: Attachment[];
  fileUrl?: string | null;
};

const FILTERS: { key: Kind | "all"; label: string; icon?: typeof Megaphone }[] = [
  { key: "all", label: "All" },
  { key: "notice", label: "Notices", icon: Megaphone },
  { key: "pupa", label: "Progress notes", icon: NotebookPen },
  { key: "report", label: "Report cards", icon: FileText },
];
const KIND_LABEL: Record<Kind, string> = { notice: "Notice", pupa: "Progress note", report: "Report card" };

const PUPA_FIELDS = [
  ["strengths", "Strengths"],
  ["improvements", "Areas to improve"],
  ["observations", "Classroom observations"],
  ["parent_support", "How parents can help"],
  ["remarks", "Teacher's remarks"],
] as const;

const toDate = (v: string) => new Date(v.length === 10 ? `${v}T00:00:00` : v);
const dayKey = (d: Date) => d.toDateString();

function DiaryPage() {
  const [filter, setFilter] = useState<Kind | "all">("all");

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  const cardsQ = useQuery({
    queryKey: qk.reportCards(student?.id),
    queryFn: () => listReportCards(student!.id),
    enabled: !!student,
  });
  const pupaQ = useQuery({ queryKey: qk.pupa(student?.id), queryFn: () => listPupa(student!.id), enabled: !!student });
  const noticesQ = useQuery({ queryKey: qk.notices, queryFn: listNotices, enabled: !!student });

  const entries = useMemo<Entry[]>(() => {
    if (!student) return [];
    const now = new Date();
    const out: Entry[] = [];

    // Only notices that have actually gone out (not scheduled for later).
    for (const n of noticesForStudent(noticesQ.data ?? [], student)) {
      if (!n.published_at || toDate(n.published_at) > now) continue;
      out.push({
        id: `n-${n.id}`,
        kind: "notice",
        at: toDate(n.published_at),
        title: n.title,
        by: n.author_name ?? "School office",
        body: n.body,
        attachments: n.attachments ?? [],
      });
    }
    // Only final PUPA reports — drafts stay with the teacher.
    for (const p of pupaQ.data ?? []) {
      if (p.status !== "final") continue;
      const when = p.submitted_at ?? p.updated_at;
      if (!when) continue;
      out.push({
        id: `p-${p.id}`,
        kind: "pupa",
        at: toDate(when),
        title: `${p.term} progress note · ${p.academic_year}`,
        by: "Class teacher",
        fields: PUPA_FIELDS.filter(([k]) => p[k]).map(([k, l]) => [l, p[k] as string]),
      });
    }
    for (const c of cardsQ.data ?? []) {
      if (!c.published_on || toDate(c.published_on) > now) continue;
      out.push({
        id: `r-${c.id}`,
        kind: "report",
        at: toDate(c.published_on),
        title: `${c.term} report card`,
        by: "School",
        body: [c.percentage != null ? `${c.percentage}%` : null, c.overall_grade].filter(Boolean).join(" · ") || null,
        fileUrl: c.file_url,
      });
    }
    return out.sort((a, b) => +b.at - +a.at);
  }, [student, noticesQ.data, pupaQ.data, cardsQ.data]);

  const shown = filter === "all" ? entries : entries.filter((e) => e.kind === filter);
  const groups = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of shown) m.set(dayKey(e.at), [...(m.get(dayKey(e.at)) ?? []), e]);
    return [...m.values()];
  }, [shown]);

  const loading =
    meQ.isLoading || (!!student && (cardsQ.isLoading || pupaQ.isLoading || noticesQ.isLoading));
  const err = meQ.error ?? cardsQ.error ?? pupaQ.error ?? noticesQ.error;

  return (
    <Page>
      <PageHeader title="Diary" subtitle="Notices, progress notes and report cards, newest first." />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                active
                  ? "border-[color:var(--signal)] bg-[color:var(--signal)]/10 text-[color:var(--signal)]"
                  : "border-line text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"
              }`}
            >
              {f.icon && <f.icon className="h-3.5 w-3.5" />}
              {f.label}
            </button>
          );
        })}
        <Link
          to="/homework"
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"
        >
          <BookOpen className="h-4 w-4" /> Homework
        </Link>
      </div>

      {loading ? (
        <LoadingRows rows={4} height={70} />
      ) : err ? (
        <ErrorState message={(err as Error).message} onRetry={() => void meQ.refetch()} />
      ) : !student ? (
        <EmptyState
          icon={NotebookPen}
          title="No student record linked"
          description="Your account isn't linked to a student record yet. Please contact the school office."
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Nothing in your diary yet"
          description="Notices, your class teacher's progress notes and report cards appear here as the school publishes them."
        />
      ) : (
        <div className="card-surface divide-y divide-[color:var(--line)]">
          {groups.map((g) => (
            <section key={dayKey(g[0].at)} className="grid gap-3 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
              <div className="text-sm font-semibold">
                {g[0].at.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                <div className="text-xs font-normal text-[color:var(--ink-soft)]">{g[0].at.getFullYear()}</div>
              </div>
              <div className="space-y-4">
                {g.map((e) => (
                  <article key={e.id}>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--signal)]">
                        {KIND_LABEL[e.kind]}
                      </span>
                      <h3 className="font-medium">{e.title}</h3>
                      <span className="text-xs text-[color:var(--ink-soft)]">· {e.by}</span>
                    </div>
                    {e.body && (
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[color:var(--ink-soft)]">
                        {e.body}
                      </p>
                    )}
                    {e.fields && e.fields.length > 0 && (
                      <dl className="mt-2 space-y-2">
                        {e.fields.map(([l, v]) => (
                          <div key={l}>
                            <dt className="text-xs text-[color:var(--ink-soft)]">{l}</dt>
                            <dd className="text-sm leading-relaxed">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {e.attachments && e.attachments.length > 0 && <AttachmentList items={e.attachments} />}
                    {e.fileUrl && (
                      <a
                        href={e.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--signal)]"
                      >
                        <Download className="h-4 w-4" /> View / download
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
