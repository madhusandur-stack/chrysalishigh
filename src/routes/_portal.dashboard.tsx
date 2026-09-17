import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CalendarClock, CalendarDays, Megaphone } from "lucide-react";
import { Page, StaggerGrid, StaggerItem } from "@/components/portal/page";
import { EmptyState, ErrorState, LoadingRows } from "@/components/portal/ui-kit";
import {
  ACADEMIC_YEAR,
  getMyIdentity,
  getTimetable,
  listAttendance,
  listHomework,
  listHomeworkStatus,
  listHomeworkTargets,
  listNotices,
  noticesForStudent,
  qk,
  sortSlots,
  todayDay,
} from "@/lib/school-api";

export const Route = createFileRoute("/_portal/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Chrysalis Connect" },
      { name: "description", content: "Your timetable, attendance, homework and latest school notices." },
      { property: "og:title", content: "Student Dashboard — Chrysalis Connect" },
      { property: "og:description", content: "Your daily school overview in Chrysalis Connect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;
  const timetableQ = useQuery({
    queryKey: qk.timetable(student?.class_id, ACADEMIC_YEAR),
    queryFn: () => getTimetable(student?.class_id ?? "", ACADEMIC_YEAR),
    enabled: Boolean(student?.class_id),
  });
  const attendanceQ = useQuery({
    queryKey: qk.attendance(student?.id),
    queryFn: () => listAttendance({ studentId: student?.id }),
    enabled: Boolean(student),
  });
  const homeworkQ = useQuery({
    queryKey: [...qk.homework, student?.class_id ?? "none"],
    queryFn: () => listHomework(student?.class_id),
    enabled: Boolean(student),
  });
  const targetsQ = useQuery({
    queryKey: ["school", "dashboard-homework-targets", ...(homeworkQ.data ?? []).map((item) => item.id)],
    queryFn: () => listHomeworkTargets((homeworkQ.data ?? []).map((item) => item.id)),
    enabled: Boolean(homeworkQ.data?.length),
  });
  const statusQ = useQuery({
    queryKey: qk.homeworkStatus(student?.id),
    queryFn: () => listHomeworkStatus(student?.id),
    enabled: Boolean(student),
  });
  const noticesQ = useQuery({ queryKey: qk.notices, queryFn: listNotices });

  const todaysSlots = useMemo(
    () => sortSlots(timetableQ.data?.published_slots ?? []).filter((slot) => slot.day === todayDay() && !slot.is_break),
    [timetableQ.data],
  );
  const attendance = attendanceQ.data ?? [];
  const attended = attendance.filter((row) => row.status === "present" || row.status === "late").length;
  const attendancePercent = attendance.length ? Math.round((attended / attendance.length) * 100) : null;
  const homework = useMemo(() => {
    const targeted = new Set((targetsQ.data ?? []).filter((target) => target.student_id === student?.id).map((target) => target.homework_id));
    const completed = new Set((statusQ.data ?? []).filter((status) => status.status === "submitted").map((status) => status.homework_id));
    return (homeworkQ.data ?? [])
      .filter((item) => item.status !== "draft" && (item.assign_all || targeted.has(item.id)) && !completed.has(item.id))
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  }, [homeworkQ.data, statusQ.data, targetsQ.data, student?.id]);
  const notices = useMemo(
    () => noticesForStudent(noticesQ.data ?? [], student).filter((notice) => !notice.scheduled_for || +new Date(notice.scheduled_for) <= Date.now()).slice(0, 3),
    [noticesQ.data, student],
  );
  const firstName = student?.full_name.trim().split(/\s+/)[0] ?? "Student";
  const classLabel = student?.classes ? `${student.classes.grade}-${student.classes.section}` : "Class not linked";
  const loading = meQ.isLoading || attendanceQ.isLoading || homeworkQ.isLoading || noticesQ.isLoading || timetableQ.isLoading;
  const error = meQ.error || attendanceQ.error || homeworkQ.error || noticesQ.error || timetableQ.error;

  if (loading) return <Page><LoadingRows rows={5} height={100} /></Page>;
  if (error) return <Page><ErrorState message={(error as Error).message} /></Page>;
  if (!student) return <Page><ErrorState message="Your account is not linked to a student profile and class. Please contact the school office." /></Page>;

  return (
    <Page>
      <div className="relative overflow-hidden rounded-[20px] border border-line bg-paper">
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mono text-[11px] uppercase text-[color:var(--ink-soft)]">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · {classLabel}
            </div>
            <h1 className="mt-3 max-w-2xl text-[32px] font-semibold leading-tight sm:text-[40px]">
              {greeting()}, {firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">Here’s what is available for you today.</p>
          </motion.div>
        </div>
      </div>

      <StaggerGrid className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-6 lg:gap-5">
        <StaggerItem className="md:col-span-4">
          <section className="card-surface h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
                <CalendarClock className="h-3.5 w-3.5" /> Today’s timetable
              </div>
              <Link to="/timetable" className="inline-flex items-center gap-1 text-xs text-[color:var(--signal)]">Full week <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {todaysSlots.length ? <div className="grid gap-2 sm:grid-cols-2">{todaysSlots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-3 rounded-[12px] border border-line bg-paper-2 px-3 py-3">
                <span className="mono grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--signal-soft)] text-xs text-[color:var(--signal)]">{slot.period_no}</span>
                <div className="min-w-0"><div className="truncate text-sm font-semibold">{slot.subject || "Unassigned"}</div><div className="mono mt-0.5 text-[10px] text-[color:var(--ink-soft)]">{slot.start_time}–{slot.end_time}{slot.teacher ? ` · ${slot.teacher}` : ""}</div></div>
              </div>
            ))}</div> : <p className="py-6 text-sm text-[color:var(--ink-soft)]">No published periods for today.</p>}
          </section>
        </StaggerItem>

        <StaggerItem className="md:col-span-2">
          <Link to="/attendance" className="card-surface card-hover flex h-full flex-col justify-between p-6">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase text-[color:var(--ink-soft)]"><CalendarDays className="h-3.5 w-3.5" /> Attendance</div>
            <div className="mt-6 text-[36px] font-semibold">{attendancePercent == null ? "—" : `${attendancePercent}%`}</div>
            <p className="mt-2 text-xs text-[color:var(--ink-soft)]">{attendance.length ? `${attendance.length} recorded school days` : "No attendance recorded yet"}</p>
          </Link>
        </StaggerItem>

        <StaggerItem className="md:col-span-3">
          <section className="card-surface h-full p-6">
            <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-[11px] font-medium uppercase text-[color:var(--ink-soft)]"><BookOpen className="h-3.5 w-3.5" /> Homework due</div><Link to="/homework" className="text-xs text-[color:var(--signal)]">View all</Link></div>
            {homework.length ? <ul className="space-y-2">{homework.slice(0, 3).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0"><div className="min-w-0"><div className="truncate text-sm font-medium">{item.topic || item.subject}</div><div className="text-xs text-[color:var(--ink-soft)]">{item.subject}</div></div><span className="mono shrink-0 text-[10px] text-[color:var(--ink-soft)]">{item.due_date ? new Date(item.due_date).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "No due date"}</span></li>)}</ul> : <p className="py-6 text-sm text-[color:var(--ink-soft)]">No pending homework.</p>}
          </section>
        </StaggerItem>

        <StaggerItem className="md:col-span-3">
          <section className="card-surface h-full p-6">
            <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-[11px] font-medium uppercase text-[color:var(--ink-soft)]"><Megaphone className="h-3.5 w-3.5" /> Latest notices</div><Link to="/noticeboard" className="text-xs text-[color:var(--signal)]">View all</Link></div>
            {notices.length ? <ul className="space-y-2">{notices.map((notice) => <li key={notice.id} className="border-b border-line py-2 last:border-0"><div className="truncate text-sm font-medium">{notice.title}</div><div className="mt-0.5 text-xs text-[color:var(--ink-soft)]">{notice.author_name || "School office"} · {new Date(notice.published_at ?? notice.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div></li>)}</ul> : <p className="py-6 text-sm text-[color:var(--ink-soft)]">No notices published for you.</p>}
          </section>
        </StaggerItem>

        <StaggerItem className="md:col-span-6">
          <div className="card-surface h-full p-6">
            <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Quick links</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: CalendarClock, label: "Timetable", to: "/timetable" },
                { icon: CalendarDays, label: "Attendance", to: "/attendance" },
                { icon: BookOpen, label: "Homework", to: "/homework" },
                { icon: Megaphone, label: "Notices", to: "/noticeboard" },
              ].map((q) => (
                <Link key={q.label} to={q.to} className="flex flex-col items-start gap-2 rounded-[14px] border border-line bg-paper-2 p-3 transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]">
                  <q.icon className="h-4 w-4" strokeWidth={1.75} />
                  <div className="text-xs font-medium">{q.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </StaggerItem>
      </StaggerGrid>
    </Page>
  );
}
