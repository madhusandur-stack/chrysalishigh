import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarClock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { FilePicker } from "@/components/portal/file-picker";
import {
  AttachmentList,
  EmptyState,
  ErrorState,
  Field,
  GhostButton,
  LoadingRows,
  PrimaryButton,
  SectionCard,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/portal/ui-kit";
import {
  DEMO_CLASS_ID,
  SUBJECTS,
  deleteHomework,
  getMyIdentity,
  listHomework,
  listHomeworkStatus,
  listHomeworkTargets,
  listStudents,
  qk,
  saveHomework,
  type Attachment,
  type HomeworkItem,
} from "@/lib/school-api";

export const Route = createFileRoute("/teacher-portal/homework")({
  head: () => ({
    meta: [
      { title: "Homework — Chrysalis Teacher Portal" },
      { name: "description", content: "Assign, schedule and track homework with chapters, topics and attachments." },
      { property: "og:title", content: "Homework — Chrysalis Teacher Portal" },
      { property: "og:description", content: "Assign, schedule and track homework for your classes." },
    ],
  }),
  component: TeacherHomework,
});

type Draft = {
  id?: string;
  subject: string;
  chapter: string;
  topic: string;
  description: string;
  due_date: string;
  scheduled_for: string;
  assign_all: boolean;
  studentIds: string[];
  attachments: Attachment[];
};

const emptyDraft = (): Draft => ({
  subject: SUBJECTS[0],
  chapter: "",
  topic: "",
  description: "",
  due_date: "",
  scheduled_for: "",
  assign_all: true,
  studentIds: [],
  attachments: [],
});

function TeacherHomework() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("all");

  const identityQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const studentsQ = useQuery({ queryKey: qk.students, queryFn: listStudents, staleTime: 300_000 });
  const homeworkQ = useQuery({
    queryKey: qk.homework,
    queryFn: () => listHomework(DEMO_CLASS_ID),
  });
  const ids = (homeworkQ.data ?? []).map((h) => h.id);
  const targetsQ = useQuery({
    queryKey: ["school", "homework-targets", ids.length],
    queryFn: () => listHomeworkTargets(ids),
    enabled: ids.length > 0,
  });
  const statusQ = useQuery({ queryKey: qk.homeworkStatus(), queryFn: () => listHomeworkStatus() });

  const students = studentsQ.data ?? [];
  const submissions = useMemo(() => {
    const map = new Map<string, { submitted: number; total: number }>();
    for (const s of statusQ.data ?? []) {
      const entry = map.get(s.homework_id) ?? { submitted: 0, total: 0 };
      entry.total += 1;
      if (s.status === "submitted") entry.submitted += 1;
      map.set(s.homework_id, entry);
    }
    return map;
  }, [statusQ.data]);

  const list = useMemo(() => {
    const rows = homeworkQ.data ?? [];
    if (filter === "all") return rows;
    if (filter === "scheduled") return rows.filter((h) => h.status === "scheduled");
    if (filter === "published") return rows.filter((h) => h.status === "published");
    return rows.filter((h) => h.subject === filter);
  }, [homeworkQ.data, filter]);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      if (!d.subject.trim()) throw new Error("Subject is required");
      if (!d.chapter.trim()) throw new Error("Chapter is required");
      if (!d.topic.trim()) throw new Error("Topic is required");
      if (!d.due_date) throw new Error("Due date is required");
      if (!d.assign_all && d.studentIds.length === 0) throw new Error("Select at least one student");
      return saveHomework({
        id: d.id,
        class_id: DEMO_CLASS_ID,
        staff_id: identityQ.data?.staff?.id ?? null,
        subject: d.subject,
        chapter: d.chapter,
        topic: d.topic,
        description: d.description || null,
        due_date: d.due_date,
        scheduled_for: d.scheduled_for || null,
        status: d.scheduled_for && d.scheduled_for > new Date().toISOString().slice(0, 10) ? "scheduled" : "published",
        assign_all: d.assign_all,
        attachments: d.attachments,
        studentIds: d.studentIds,
      });
    },
    onSuccess: () => {
      toast.success("Homework saved");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: qk.homework });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save homework"),
  });

  const remove = useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => {
      toast.success("Homework deleted");
      void qc.invalidateQueries({ queryKey: qk.homework });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  function startEdit(h: HomeworkItem) {
    setDraft({
      id: h.id,
      subject: h.subject,
      chapter: h.chapter ?? "",
      topic: h.topic ?? "",
      description: h.description ?? "",
      due_date: h.due_date ?? "",
      scheduled_for: h.scheduled_for ?? "",
      assign_all: h.assign_all,
      studentIds: (targetsQ.data ?? []).filter((t) => t.homework_id === h.id).map((t) => t.student_id),
      attachments: h.attachments ?? [],
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PortalPageHeader
        eyebrow="Homework"
        title="Assign & track homework"
        description="Attach files, schedule for a future date, and assign to the whole class or selected students."
        actions={
          <PrimaryButton onClick={() => setDraft(draft ? null : emptyDraft())}>
            <Plus className="h-4 w-4" /> {draft ? "Close form" : "New homework"}
          </PrimaryButton>
        }
      />

      {draft && (
        <SectionCard
          className="mb-6"
          title={draft.id ? "Edit homework" : "New homework"}
          description="Chapter, topic and due date are required."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Subject" required>
              <Select value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Chapter" required>
              <TextInput
                value={draft.chapter}
                placeholder="Chapter 4 — Quadratic Equations"
                onChange={(e) => setDraft({ ...draft, chapter: e.target.value })}
              />
            </Field>
            <Field label="Topic" required>
              <TextInput
                value={draft.topic}
                placeholder="Solving by factorisation"
                onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
              />
            </Field>
            <Field label="Due date" required>
              <TextInput
                type="date"
                value={draft.due_date}
                onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
              />
            </Field>
            <Field label="Schedule for" hint="Leave blank to publish immediately.">
              <TextInput
                type="date"
                value={draft.scheduled_for}
                onChange={(e) => setDraft({ ...draft, scheduled_for: e.target.value })}
              />
            </Field>
            <Field label="Assign to">
              <Select
                value={draft.assign_all ? "all" : "selected"}
                onChange={(e) => setDraft({ ...draft, assign_all: e.target.value === "all" })}
              >
                <option value="all">Whole class</option>
                <option value="selected">Selected students</option>
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Instructions">
              <TextArea
                value={draft.description}
                placeholder="What should students do? Mention page numbers, exercises, expectations…"
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
          </div>

          {!draft.assign_all && (
            <div className="mt-4 rounded-[14px] border border-line bg-paper-2/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-[color:var(--ink-soft)]">
                  Students ({draft.studentIds.length} selected)
                </span>
                <GhostButton
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      studentIds: draft.studentIds.length === students.length ? [] : students.map((s) => s.id),
                    })
                  }
                >
                  {draft.studentIds.length === students.length ? "Clear all" : "Select all"}
                </GhostButton>
              </div>
              <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {students.map((s) => {
                  const checked = draft.studentIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-sm hover:bg-paper">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setDraft({
                            ...draft,
                            studentIds: checked
                              ? draft.studentIds.filter((id) => id !== s.id)
                              : [...draft.studentIds, s.id],
                          })
                        }
                        className="h-4 w-4 rounded border-line accent-[color:var(--signal)]"
                      />
                      <span className="truncate">
                        {s.roll_no}. {s.full_name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4">
            <FilePicker
              folder="homework"
              value={draft.attachments}
              onChange={(attachments) => setDraft({ ...draft, attachments })}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
            <PrimaryButton loading={save.isPending} onClick={() => save.mutate(draft)}>
              {draft.id ? "Update homework" : "Assign homework"}
            </PrimaryButton>
            <GhostButton onClick={() => setDraft(null)}>Cancel</GhostButton>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Assigned homework"
        description={`${list.length} item${list.length === 1 ? "" : "s"} for Grade IX-B`}
        actions={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
        bodyClassName="p-4 sm:p-5"
      >
        {homeworkQ.isLoading ? (
          <LoadingRows rows={4} height={84} />
        ) : homeworkQ.isError ? (
          <ErrorState message={(homeworkQ.error as Error)?.message} onRetry={() => void homeworkQ.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No homework yet"
            description="Create your first assignment — students see it in their diary instantly."
            action={<PrimaryButton onClick={() => setDraft(emptyDraft())}>New homework</PrimaryButton>}
          />
        ) : (
          <ul className="space-y-3">
            {list.map((h) => {
              const sub = submissions.get(h.id);
              return (
                <li key={h.id} className="rounded-[16px] border border-line bg-paper-2/40 p-4 transition hover:bg-paper-2/70">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--signal)]">
                          {h.subject}
                        </span>
                        <StatusPill status={h.status} />
                        {!h.assign_all && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--ink-soft)]">
                            <Users className="h-3 w-3" /> Selected students
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold tracking-tight">
                        {h.chapter} · {h.topic}
                      </p>
                      {h.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[color:var(--ink-soft)]">{h.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[color:var(--ink-soft)]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          Due {h.due_date ? new Date(h.due_date).toLocaleDateString() : "—"}
                        </span>
                        {h.scheduled_for && <span>Scheduled {new Date(h.scheduled_for).toLocaleDateString()}</span>}
                        {sub && (
                          <span>
                            {sub.submitted}/{sub.total} submitted
                          </span>
                        )}
                      </div>
                      <AttachmentList items={h.attachments ?? []} />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <GhostButton aria-label="Edit homework" onClick={() => startEdit(h)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </GhostButton>
                      <GhostButton
                        aria-label="Delete homework"
                        className="hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this homework?")) remove.mutate(h.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </GhostButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
