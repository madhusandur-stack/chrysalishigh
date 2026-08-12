import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Megaphone, Pin } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import {
  AttachmentList,
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  StatusPill,
} from "@/components/portal/ui-kit";
import { SmoothSearchInput } from "@/components/ui/smooth-input";
import {
  getMyIdentity,
  listNoticeReads,
  listNotices,
  markAllNoticesRead,
  markNoticeRead,
  noticesForStudent,
  qk,
} from "@/lib/school-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_portal/noticeboard")({
  head: () => ({
    meta: [
      { title: "Noticeboard — Chrysalis Connect" },
      {
        name: "description",
        content: "Announcements, circulars and class updates published by Chrysalis High, newest first.",
      },
      { property: "og:title", content: "Noticeboard — Chrysalis Connect" },
      { property: "og:description", content: "School-wide and class-specific announcements in one feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NoticeboardPage,
});

const SCOPES = ["all", "unread", "school", "class", "students"] as const;

function relative(iso: string | null) {
  if (!iso) return "Scheduled";
  const mins = Math.round((Date.now() - +new Date(iso)) / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: string) {
  if (role === "teacher") return "Teacher";
  if (role === "campus_admin" || role === "admin" || role === "system_admin") return "Admin";
  return role.replace(/_/g, " ");
}

function NoticeboardPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<(typeof SCOPES)[number]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const studentId = meQ.data?.student?.id ?? null;

  const noticesQ = useQuery({
    queryKey: qk.notices,
    queryFn: listNotices,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const readsQ = useQuery({
    queryKey: qk.noticeReads(studentId ?? undefined),
    queryFn: () => listNoticeReads(studentId!),
    enabled: !!studentId,
  });

  const readSet = useMemo(
    () => new Set((readsQ.data ?? []).map((r) => r.notice_id)),
    [readsQ.data],
  );

  const markRead = useMutation({
    mutationFn: (id: string) => markNoticeRead(id, studentId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.noticeReads(studentId ?? undefined) }),
  });

  const mine = useMemo(
    () =>
      noticesForStudent(noticesQ.data ?? [], meQ.data?.student ?? null).filter(
        (n) => !n.scheduled_for || +new Date(n.scheduled_for) <= Date.now(),
      ),
    [noticesQ.data, meQ.data],
  );

  const unreadCount = mine.filter((n) => !readSet.has(n.id)).length;

  const markAll = useMutation({
    mutationFn: () => markAllNoticesRead(mine.map((n) => n.id), studentId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.noticeReads(studentId ?? undefined) }),
  });

  const visible = useMemo(() => {
    return mine
      .filter((n) =>
        scope === "all" ? true : scope === "unread" ? !readSet.has(n.id) : n.scope === scope,
      )
      .filter((n) => (q ? `${n.title} ${n.body ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true))
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          +new Date(b.published_at ?? b.created_at) - +new Date(a.published_at ?? a.created_at),
      );
  }, [mine, readSet, scope, q]);

  const loading = meQ.isLoading || noticesQ.isLoading;

  return (
    <Page>
      <PageHeader
        title="Noticeboard"
        subtitle={
          unreadCount
            ? `${unreadCount} unread notice${unreadCount === 1 ? "" : "s"} for you.`
            : "Announcements, circulars and updates from Chrysalis High."
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <SmoothSearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          placeholder="Search notices…"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {SCOPES.map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition",
                scope === s
                  ? "border-[color:var(--signal)] bg-[color:var(--signal)] text-white"
                  : "border-line bg-paper text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
              )}
            >
              {s === "students" ? "For me" : s}
              {s === "unread" && unreadCount ? ` (${unreadCount})` : ""}
            </button>
          ))}
          {studentId && unreadCount > 0 && (
            <GhostButton onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </GhostButton>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingRows rows={5} height={88} />
      ) : noticesQ.isError ? (
        <ErrorState message={(noticesQ.error as Error)?.message} onRetry={() => void noticesQ.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices" description="Nothing has been published for you yet." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((n) => {
              const open = openId === n.id;
              const unread = !readSet.has(n.id);
              return (
                <motion.article
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "card-surface overflow-hidden",
                    unread && "border-[color:var(--signal)]",
                  )}
                >
                  <button
                    onClick={() => {
                      const next = open ? null : n.id;
                      setOpenId(next);
                      if (next && unread && studentId) markRead.mutate(n.id);
                    }}
                    aria-expanded={open}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        unread ? "bg-[color:var(--signal)]" : "bg-transparent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.pinned && <Pin className="h-3.5 w-3.5 text-[color:var(--signal)]" />}
                        <h3 className="truncate text-sm font-semibold">{n.title}</h3>
                        <StatusPill status={n.scope === "school" ? "present" : "pending"}>
                          {n.scope === "students" ? "for me" : n.scope}
                        </StatusPill>
                        {unread && <StatusPill status="absent">unread</StatusPill>}
                      </div>
                      <p
                        className={cn("mt-1 text-sm text-[color:var(--ink-soft)]", !open && "line-clamp-2")}
                      >
                        {n.body}
                      </p>
                      <div className="mono mt-2 text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                        {n.author_name ?? "School office"} · {roleLabel(n.author_role)} ·{" "}
                        {relative(n.published_at ?? n.created_at)}
                      </div>
                      {open && n.attachments?.length ? <AttachmentList items={n.attachments} /> : null}
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </Page>
  );
}
