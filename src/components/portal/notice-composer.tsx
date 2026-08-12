import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Megaphone, Pin, Trash2, Users, User as UserIcon, School } from "lucide-react";
import {
  AttachmentList,
  Field,
  GhostButton,
  PrimaryButton,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/portal/ui-kit";
import { FilePicker } from "@/components/portal/file-picker";
import {
  deleteNotice,
  listClasses,
  listNotices,
  listStudents,
  qk,
  saveNotice,
  type Attachment,
  type Notice,
} from "@/lib/school-api";
import { cn } from "@/lib/utils";

type Scope = "school" | "class" | "students";

const SCOPE_META: Record<Scope, { label: string; hint: string; icon: typeof School }> = {
  school: { label: "Whole school", hint: "Every student sees this notice.", icon: School },
  class: { label: "Specific classes", hint: "Only students in the selected classes.", icon: Users },
  students: { label: "Specific students", hint: "Only the students you pick.", icon: UserIcon },
};

/**
 * Shared notice composer + list used by both the Teacher and Admin portals.
 * Everything writes to `notice_items`, which is the exact table the student
 * noticeboard reads, so targeting works end to end.
 */
export function NoticeManager({
  authorName,
  authorRole,
  defaultClassIds = [],
  lockedClassIds,
}: {
  authorName: string;
  authorRole: "teacher" | "admin";
  defaultClassIds?: string[];
  /** When set, the composer can only target these classes (class teachers). */
  lockedClassIds?: string[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const noticesQ = useQuery({ queryKey: qk.notices, queryFn: listNotices, refetchInterval: 20_000 });
  const classesQ = useQuery({ queryKey: qk.classes, queryFn: listClasses, staleTime: 300_000 });
  const studentsQ = useQuery({ queryKey: qk.students, queryFn: listStudents, staleTime: 300_000 });

  const classes = useMemo(() => {
    const all = (classesQ.data ?? []) as { id: string; grade: string; section: string }[];
    return lockedClassIds?.length ? all.filter((c) => lockedClassIds.includes(c.id)) : all;
  }, [classesQ.data, lockedClassIds]);

  const mine = useMemo(() => {
    const rows = (noticesQ.data ?? []).filter((n) =>
      authorRole === "teacher" ? n.author_role === "teacher" : true,
    );
    return rows.sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        +new Date(b.published_at ?? b.created_at) - +new Date(a.published_at ?? a.created_at),
    );
  }, [noticesQ.data, authorRole]);

  const remove = useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      toast.success("Notice removed");
      qc.invalidateQueries({ queryKey: qk.notices });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-5 flex justify-end">
        <PrimaryButton onClick={() => setOpen((s) => !s)}>
          {open ? "Close composer" : "New notice"}
        </PrimaryButton>
      </div>

      {open && (
        <NoticeForm
          authorName={authorName}
          authorRole={authorRole}
          classes={classes}
          students={(studentsQ.data ?? []).map((s) => ({
            id: s.id,
            full_name: s.full_name,
            class_id: s.class_id,
            roll_no: s.roll_no,
          }))}
          defaultClassIds={defaultClassIds.filter((id) => classes.some((c) => c.id === id))}
          onDone={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: qk.notices });
          }}
        />
      )}

      {noticesQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[16px] bg-paper-2" />
          ))}
        </div>
      ) : mine.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-6 w-6 text-[color:var(--ink-soft)]" />
          <div className="text-sm font-medium">No notices yet</div>
          <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
            Publish one and it appears instantly on the targeted students' noticeboards.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {mine.map((n) => (
            <NoticeRow
              key={n.id}
              notice={n}
              classes={classes}
              studentCount={(n.student_ids ?? []).length}
              onDelete={() => {
                if (confirm(`Delete "${n.title}"?`)) remove.mutate(n.id);
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function NoticeRow({
  notice,
  classes,
  studentCount,
  onDelete,
}: {
  notice: Notice;
  classes: { id: string; grade: string; section: string }[];
  studentCount: number;
  onDelete: () => void;
}) {
  const target =
    notice.scope === "school"
      ? "Whole school"
      : notice.scope === "class"
        ? (notice.class_ids ?? [])
            .map((id) => {
              const c = classes.find((x) => x.id === id);
              return c ? `${c.grade}-${c.section}` : "Class";
            })
            .join(", ") || "Selected classes"
        : `${studentCount} student${studentCount === 1 ? "" : "s"}`;

  return (
    <li className="rounded-[16px] border border-line bg-paper p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {notice.pinned && <Pin className="h-3.5 w-3.5 text-[color:var(--signal)]" />}
            <h3 className="text-base font-semibold tracking-tight">{notice.title}</h3>
            <StatusPill status={notice.scope === "school" ? "present" : "pending"}>{target}</StatusPill>
          </div>
          {notice.body && (
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-[color:var(--ink-soft)]">{notice.body}</p>
          )}
          {notice.attachments?.length ? <AttachmentList items={notice.attachments} /> : null}
          <div className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
            {notice.author_name ?? "School office"} · {notice.author_role} ·{" "}
            {new Date(notice.published_at ?? notice.created_at).toLocaleString()}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-paper-2 hover:text-[color:var(--ember)]"
          aria-label={`Delete ${notice.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function NoticeForm({
  authorName,
  authorRole,
  classes,
  students,
  defaultClassIds,
  onDone,
}: {
  authorName: string;
  authorRole: "teacher" | "admin";
  classes: { id: string; grade: string; section: string }[];
  students: { id: string; full_name: string; class_id: string; roll_no: number }[];
  defaultClassIds: string[];
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<Scope>(defaultClassIds.length ? "class" : "school");
  const [classIds, setClassIds] = useState<string[]>(defaultClassIds);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [studentClassFilter, setStudentClassFilter] = useState<string>(classes[0]?.id ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required.");
      if (scope === "class" && !classIds.length) throw new Error("Pick at least one class.");
      if (scope === "students" && !studentIds.length) throw new Error("Pick at least one student.");
      await saveNotice({
        title: title.trim(),
        body: body.trim() || null,
        scope,
        class_ids: scope === "class" ? classIds : [],
        student_ids: scope === "students" ? studentIds : [],
        attachments,
        author_name: authorName,
        author_role: authorRole,
        pinned,
        published_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Notice published");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredStudents = students.filter((s) =>
    studentClassFilter ? s.class_id === studentClassFilter : true,
  );

  return (
    <div className="mb-6 rounded-[20px] border border-line bg-paper p-6">
      <div className="grid gap-4">
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice title" />
        </Field>
        <Field label="Description">
          <TextArea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do you want to announce?"
          />
        </Field>

        <div>
          <div className="mb-2 text-xs font-medium text-[color:var(--ink-soft)]">Audience</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCOPE_META) as Scope[]).map((s) => {
              const Icon = SCOPE_META[s].icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    scope === s
                      ? "border-[color:var(--signal)] bg-[color:var(--signal)] text-white"
                      : "border-line bg-paper text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {SCOPE_META[s].label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[color:var(--ink-soft)]">{SCOPE_META[scope].hint}</p>
        </div>

        {scope === "class" && (
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const on = classIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setClassIds((prev) => (on ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    on
                      ? "border-[color:var(--signal)] bg-[color-mix(in_srgb,var(--signal)_14%,transparent)] text-[color:var(--signal)]"
                      : "border-line bg-paper text-[color:var(--ink-soft)]",
                  )}
                >
                  {c.grade} – {c.section}
                </button>
              );
            })}
            {!classes.length && (
              <span className="text-xs text-[color:var(--ink-soft)]">No classes available.</span>
            )}
          </div>
        )}

        {scope === "students" && (
          <div className="rounded-[14px] border border-line bg-paper-2 p-4">
            <Field label="Filter by class">
              <Select
                value={studentClassFilter}
                onChange={(e) => setStudentClassFilter(e.target.value)}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.grade} – {c.section}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-3 max-h-56 overflow-auto rounded-[10px] border border-line bg-paper">
              {filteredStudents.map((s) => {
                const on = studentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2 text-sm last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setStudentIds((prev) =>
                          on ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                        )
                      }
                    />
                    <span className="mono text-[11px] text-[color:var(--ink-soft)]">
                      #{s.roll_no}
                    </span>
                    {s.full_name}
                  </label>
                );
              })}
              {!filteredStudents.length && (
                <div className="px-3 py-4 text-sm text-[color:var(--ink-soft)]">No students found.</div>
              )}
            </div>
            <div className="mt-2 text-xs text-[color:var(--ink-soft)]">
              {studentIds.length} selected
            </div>
          </div>
        )}

        <FilePicker value={attachments} onChange={setAttachments} folder="notices" />

        <label className="flex items-center gap-2 text-xs text-[color:var(--ink-soft)]">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-4 w-4"
          />
          Pin this notice to the top
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <GhostButton onClick={onDone}>Cancel</GhostButton>
        <PrimaryButton onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish
        </PrimaryButton>
      </div>
    </div>
  );
}
