import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Users } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import {
  EmptyState,
  ErrorState,
  Field,
  GhostButton,
  LoadingRows,
  SectionCard,
  Select,
  StatCard,
  StatusPill,
  TableWrap,
  Td,
  Th,
  TextInput,
} from "@/components/portal/ui-kit";
import { listStaff, listTeacherAttendance, qk, type TeacherAttendance } from "@/lib/school-api";

export const Route = createFileRoute("/staff-portal/teacher-attendance")({
  head: () => ({
    meta: [
      { title: "Teacher Attendance — Chrysalis Staff Portal" },
      {
        name: "description",
        content: "Live punch status, presence counts and monthly attendance reports for every teacher on campus.",
      },
      { property: "og:title", content: "Teacher Attendance — Chrysalis Staff Portal" },
      { property: "og:description", content: "Monitor teacher punch-in status, leave and monthly attendance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherAttendanceDashboard,
});

const STATUSES = ["all", "present", "late", "half_day", "early_departure", "absent", "leave"] as const;

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(y!, m!, 0)).toISOString().slice(0, 10);
  return { from, to };
}

function TeacherAttendanceDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [day, setDay] = useState(today);

  const { from, to } = monthBounds(month);

  const staffQ = useQuery({ queryKey: qk.staff, queryFn: listStaff, staleTime: 300_000 });
  const attQ = useQuery({
    queryKey: [...qk.teacherAttendance(), from, to],
    queryFn: () => listTeacherAttendance({ from, to }),
  });

  const teachers = useMemo(
    () => (staffQ.data ?? []).filter((s) => s.role !== "admin"),
    [staffQ.data],
  );

  /** Attendance rows for the selected day, one per teacher (missing = no punch). */
  const dayRows = useMemo(() => {
    const byStaff = new Map<string, TeacherAttendance>();
    for (const r of attQ.data ?? []) if (r.date === day) byStaff.set(r.staff_id, r);
    return teachers.map((t) => ({ staff: t, row: byStaff.get(t.id) ?? null }));
  }, [attQ.data, teachers, day]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dayRows.filter(({ staff, row }) => {
      const st = row?.status ?? "no_punch";
      if (status !== "all" && st !== status) return false;
      if (!q) return true;
      return (
        staff.full_name.toLowerCase().includes(q) ||
        (staff.employee_no ?? "").toLowerCase().includes(q) ||
        (staff.subject ?? "").toLowerCase().includes(q)
      );
    });
  }, [dayRows, status, search]);

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, half_day: 0, absent: 0, leave: 0, no_punch: 0 };
    for (const { row } of dayRows) {
      const st = row?.status ?? "no_punch";
      if (st === "early_departure") c.present += 1;
      else if (st in c) c[st as keyof typeof c] += 1;
    }
    return c;
  }, [dayRows]);

  /** Monthly per-teacher summary: present days and average working hours. */
  const monthly = useMemo(() => {
    const map = new Map<string, { present: number; late: number; absent: number; hours: number; days: number }>();
    for (const r of attQ.data ?? []) {
      const e = map.get(r.staff_id) ?? { present: 0, late: 0, absent: 0, hours: 0, days: 0 };
      if (r.status === "absent" || r.status === "leave") e.absent += 1;
      else e.present += 1;
      if (r.status === "late") e.late += 1;
      e.hours += r.working_hours ?? 0;
      e.days += 1;
      map.set(r.staff_id, e);
    }
    return teachers.map((t) => ({
      staff: t,
      ...(map.get(t.id) ?? { present: 0, late: 0, absent: 0, hours: 0, days: 0 }),
    }));
  }, [attQ.data, teachers]);

  function exportCsv() {
    const header = ["Employee No", "Teacher", "Subject", "Days recorded", "Present", "Late", "Absent/Leave", "Avg hours"];
    const lines = monthly.map((m) => [
      m.staff.employee_no ?? "",
      m.staff.full_name,
      m.staff.subject ?? "",
      String(m.days),
      String(m.present),
      String(m.late),
      String(m.absent),
      m.days ? (m.hours / m.days).toFixed(1) : "0.0",
    ]);
    const csv = [header, ...lines]
      .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher-attendance-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const loading = staffQ.isLoading || attQ.isLoading;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Teacher attendance"
        description="Live punch status for the selected day plus a monthly report you can export."
        actions={
          <GhostButton onClick={exportCsv} disabled={loading}>
            <Download className="h-4 w-4" /> Export CSV
          </GhostButton>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Present" value={counts.present} />
        <StatCard label="Late" value={counts.late} />
        <StatCard label="Half day" value={counts.half_day} />
        <StatCard label="Absent / leave" value={counts.absent + counts.leave} />
        <StatCard label="No punch" value={counts.no_punch} />
      </div>

      <SectionCard title="Filters" description="Search by name, employee number or subject.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Day">
            <TextInput type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </Field>
          <Field label="Month (report)">
            <TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Search">
            <TextInput
              placeholder="Teacher, employee no, subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="mt-5">
        <SectionCard
          title={`Punch status — ${new Date(day).toLocaleDateString(undefined, { day: "numeric", month: "long" })}`}
          description={`${filtered.length} of ${teachers.length} teachers shown`}
        >
          {loading ? (
            <LoadingRows rows={6} />
          ) : attQ.isError ? (
            <ErrorState message={(attQ.error as Error)?.message} onRetry={() => void attQ.refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No teachers match" description="Adjust the filters to see more rows." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Teacher</Th>
                  <Th>Subject</Th>
                  <Th>Punch in</Th>
                  <Th>Punch out</Th>
                  <Th>Hours</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ staff, row }) => (
                  <tr key={staff.id}>
                    <Td>
                      <div className="font-medium">{staff.full_name}</div>
                      <div className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                        {staff.employee_no ?? "—"}
                      </div>
                    </Td>
                    <Td>{staff.subject ?? "—"}</Td>
                    <Td>{row?.punch_in ?? "—"}</Td>
                    <Td>{row?.punch_out ?? "—"}</Td>
                    <Td>{row?.working_hours != null ? `${row.working_hours}h` : "—"}</Td>
                    <Td>
                      <StatusPill status={row?.status ?? "no_punch"}>
                        {(row?.status ?? "no punch").replace("_", " ")}
                      </StatusPill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard title={`Monthly report — ${month}`} description="Days recorded, presence split and average working hours.">
          {loading ? (
            <LoadingRows rows={6} />
          ) : monthly.length === 0 ? (
            <EmptyState icon={Users} title="No teachers yet" description="Add staff members to see attendance." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Teacher</Th>
                  <Th>Days</Th>
                  <Th>Present</Th>
                  <Th>Late</Th>
                  <Th>Absent / leave</Th>
                  <Th>Avg hours</Th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.staff.id}>
                    <Td>{m.staff.full_name}</Td>
                    <Td>{m.days}</Td>
                    <Td>{m.present}</Td>
                    <Td>{m.late}</Td>
                    <Td>{m.absent}</Td>
                    <Td>{m.days ? `${(m.hours / m.days).toFixed(1)}h` : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
