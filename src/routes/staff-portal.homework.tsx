import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Search, FilterX } from "lucide-react";
import { listCampusHomework } from "@/lib/staff-admin.functions";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { SmoothSearchInput } from "@/components/ui/smooth-input";

export const Route = createFileRoute("/staff-portal/homework")({
  component: StaffHomework,
});

function StaffHomework() {
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const listFn = useServerFn(listCampusHomework);
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff-homework", search, grade, teacherId],
    queryFn: () => listFn({ data: { search, grade, teacherId } }),
    staleTime: 30_000,
  });

  const homework = data?.homework ?? [];
  const teachers = data?.teachers ?? [];
  const grades = data?.grades ?? [];

  const hasFilters = search || grade || teacherId;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Homework oversight"
        description="Review homework posted across all classes in your campus."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SmoothSearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by title, subject, or description…"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-12 rounded-[14px] border border-line bg-paper px-3 text-sm outline-none focus:border-[color:var(--signal)]"
          >
            <option value="">All grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="h-12 rounded-[14px] border border-line bg-paper px-3 text-sm outline-none focus:border-[color:var(--signal)]"
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setGrade("");
                setTeacherId("");
              }}
              className="inline-flex h-12 items-center gap-1.5 rounded-[14px] border border-line bg-paper px-3 text-sm text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
            >
              <FilterX className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-[16px] border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-4 py-3 text-sm text-[color:var(--ember)]">
          {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[16px] bg-paper-2" />
          ))}
        </div>
      ) : homework.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-6 w-6 text-[color:var(--ink-soft)]" />
          <div className="text-sm font-medium">No homework found</div>
          <div className="mt-1 text-xs text-[color:var(--ink-soft)]">
            {hasFilters
              ? "Try adjusting your filters."
              : "Teachers can post homework from their portal."}
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {homework.map((h) => (
            <li
              key={h.id}
              className="rounded-[16px] border border-line bg-paper p-4 transition hover:border-[color:var(--signal)]/40"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{h.title}</span>
                    {h.subject && (
                      <span className="rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[10px] font-medium text-[color:var(--ink-soft)]">
                        {h.subject}
                      </span>
                    )}
                    <StatusBadge status={h.status} />
                  </div>
                  <div className="mt-1 text-xs text-[color:var(--ink-soft)]">
                    Class {h.class_grade} · Section {h.class_section} · Posted by {h.teacher_name}
                  </div>
                  {h.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-[color:var(--ink-soft)]">
                      {h.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {h.due_date ? (
                    <div className="text-xs font-medium text-[color:var(--ember)]">
                      Due {new Date(h.due_date).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-xs text-[color:var(--ink-soft)]">No due date</div>
                  )}
                  <div className="mt-0.5 text-[10px] text-[color:var(--ink-soft)]">
                    {new Date(h.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isDraft = status === "draft";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        isDraft
          ? "border border-line bg-paper-2 text-[color:var(--ink-soft)]"
          : "border border-[color:var(--signal)]/30 bg-[color:var(--signal-soft)] text-[color:var(--signal)]"
      }`}
    >
      {status}
    </span>
  );
}
