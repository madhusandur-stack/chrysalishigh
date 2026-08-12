/**
 * School API — single abstraction layer over the backend for every new module.
 *
 * All reads/writes go through the generated Supabase client (RLS applies to the
 * signed-in portal session). Query keys are exported so mutations can invalidate
 * precisely. Every function returns plain data or throws, so React Query owns
 * loading/error/retry state in the UI.
 */
import { supabase } from "@/integrations/supabase/client";

export const DEMO_CLASS_ID = "11111111-1111-4111-8111-111111111111";
export const ACADEMIC_YEAR = "2026-27";
export const TERMS = ["Term 1", "Term 2"] as const;
export const REPORT_TERMS = ["Term 1", "Term 2", "Final"] as const;
export const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Hindi",
  "Computer Science",
] as const;

export type Term = (typeof TERMS)[number];

export const qk = {
  students: ["school", "students"] as const,
  staff: ["school", "staff"] as const,
  classes: ["school", "classes"] as const,
  mine: ["school", "mine"] as const,
  attendance: (id?: string) => ["school", "attendance", id ?? "all"] as const,
  homework: ["school", "homework"] as const,
  homeworkStatus: (id?: string) => ["school", "homework-status", id ?? "all"] as const,
  planner: ["school", "planner"] as const,
  teacherAttendance: (id?: string) => ["school", "teacher-attendance", id ?? "all"] as const,
  regularization: ["school", "regularization"] as const,
  notices: ["school", "notices"] as const,
  noticeReads: (id?: string) => ["school", "notice-reads", id ?? "all"] as const,
  timetable: (classId?: string, year?: string) =>
    ["school", "timetable", classId ?? "all", year ?? "current"] as const,
  cce: (id?: string) => ["school", "cce", id ?? "all"] as const,
  pupa: (id?: string) => ["school", "pupa", id ?? "all"] as const,
  reportCards: (id?: string) => ["school", "report-cards", id ?? "all"] as const,
};

function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

/* ------------------------------- roster ------------------------------- */

export type Student = {
  id: string;
  class_id: string;
  full_name: string;
  roll_no: number;
  admission_no: string;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  house: string | null;
  father_name: string | null;
  father_phone: string | null;
  father_email: string | null;
  father_occupation: string | null;
  mother_name: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  mother_occupation: string | null;
  address: string | null;
  is_portal_demo: boolean;
};

export async function listStudents(): Promise<Student[]> {
  return unwrap(
    await supabase.from("students").select("*").order("roll_no", { ascending: true }),
  ) as Student[];
}

export type Staff = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  subject: string | null;
  phone: string | null;
  employee_no: string | null;
  is_portal_demo: boolean;
};

export async function listStaff(): Promise<Staff[]> {
  return unwrap(
    await supabase.from("staff_members").select("*").order("full_name"),
  ) as Staff[];
}

export async function listClasses() {
  return unwrap(
    await supabase.from("classes").select("id, grade, section, subject").order("grade"),
  );
}

/** The student / staff identity the current demo session represents. */
export async function getMyIdentity() {
  const [students, staff] = await Promise.all([
    supabase.from("students").select("*").eq("is_portal_demo", true).maybeSingle(),
    supabase.from("staff_members").select("*").eq("is_portal_demo", true).maybeSingle(),
  ]);
  return {
    student: (students.data ?? null) as Student | null,
    staff: (staff.data ?? null) as Staff | null,
  };
}

/* ---------------------------- student attendance ---------------------------- */

export type AttendanceDay = { id: string; student_id: string; date: string; status: string };

export async function listAttendance(opts: { studentId?: string; from?: string; to?: string } = {}) {
  let q = supabase.from("attendance_days").select("id, student_id, date, status");
  if (opts.studentId) q = q.eq("student_id", opts.studentId);
  if (opts.from) q = q.gte("date", opts.from);
  if (opts.to) q = q.lte("date", opts.to);
  return unwrap(await q.order("date", { ascending: false })) as AttendanceDay[];
}

/* -------------------------------- homework -------------------------------- */

export type Attachment = { name: string; url: string; type?: string };

export type HomeworkItem = {
  id: string;
  class_id: string;
  staff_id: string | null;
  subject: string;
  chapter: string | null;
  topic: string | null;
  description: string | null;
  due_date: string | null;
  scheduled_for: string | null;
  status: string;
  assign_all: boolean;
  attachments: Attachment[];
  created_at: string;
};

export async function listHomework(classId?: string) {
  let q = supabase.from("homework_items").select("*");
  if (classId) q = q.eq("class_id", classId);
  return unwrap(await q.order("due_date", { ascending: false })) as unknown as HomeworkItem[];
}

export type HomeworkInput = {
  id?: string;
  class_id: string;
  staff_id?: string | null;
  subject: string;
  chapter?: string | null;
  topic?: string | null;
  description?: string | null;
  due_date?: string | null;
  scheduled_for?: string | null;
  status?: string;
  assign_all: boolean;
  attachments?: Attachment[];
  studentIds?: string[];
};

export async function saveHomework(input: HomeworkInput) {
  const { studentIds, ...row } = input;
  const payload = { ...row, attachments: (row.attachments ?? []) as never };
  const saved = unwrap(
    await supabase.from("homework_items").upsert(payload as never).select("id").single(),
  ) as { id: string };

  await supabase.from("homework_targets").delete().eq("homework_id", saved.id);
  if (!input.assign_all && studentIds?.length) {
    unwrap(
      await supabase
        .from("homework_targets")
        .insert(studentIds.map((student_id) => ({ homework_id: saved.id, student_id })) as never),
    );
  }
  return saved;
}

export async function deleteHomework(id: string) {
  unwrap(await supabase.from("homework_items").delete().eq("id", id));
}

export async function listHomeworkTargets(homeworkIds: string[]) {
  if (!homeworkIds.length) return [];
  return unwrap(
    await supabase.from("homework_targets").select("homework_id, student_id").in("homework_id", homeworkIds),
  ) as { homework_id: string; student_id: string }[];
}

export async function listHomeworkStatus(studentId?: string) {
  let q = supabase.from("homework_status").select("homework_id, student_id, status, submitted_at");
  if (studentId) q = q.eq("student_id", studentId);
  return unwrap(await q) as {
    homework_id: string;
    student_id: string;
    status: string;
    submitted_at: string | null;
  }[];
}

/* ---------------------------- academic planner ---------------------------- */

export type PlanTopic = {
  id: string;
  plan_id: string;
  chapter: string;
  topic: string;
  expected_date: string | null;
  completed: boolean;
  completed_on: string | null;
  remarks: string | null;
  sort_order: number;
};

export type LessonPlan = {
  id: string;
  subject: string;
  class_id: string;
  academic_year: string;
  lesson_plan_topics: PlanTopic[];
};

export async function listLessonPlans(classId = DEMO_CLASS_ID) {
  return unwrap(
    await supabase
      .from("lesson_plans")
      .select("id, subject, class_id, academic_year, lesson_plan_topics(*)")
      .eq("class_id", classId)
      .order("subject"),
  ) as unknown as LessonPlan[];
}

export async function updatePlanTopic(
  id: string,
  patch: { completed?: boolean; remarks?: string | null; completed_on?: string | null },
) {
  unwrap(await supabase.from("lesson_plan_topics").update(patch as never).eq("id", id));
}

/* --------------------------- teacher attendance --------------------------- */

export type TeacherAttendance = {
  id: string;
  staff_id: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  working_hours: number | null;
  status: string;
};

export async function listTeacherAttendance(
  opts: { staffId?: string; from?: string; to?: string } = {},
) {
  let q = supabase.from("teacher_attendance").select("*");
  if (opts.staffId) q = q.eq("staff_id", opts.staffId);
  if (opts.from) q = q.gte("date", opts.from);
  if (opts.to) q = q.lte("date", opts.to);
  return unwrap(await q.order("date", { ascending: false })) as TeacherAttendance[];
}

function hoursBetween(inTime: string, outTime: string) {
  const [ih, im] = inTime.split(":").map(Number);
  const [oh, om] = outTime.split(":").map(Number);
  return Math.max(0, Math.round(((oh! * 60 + om!) - (ih! * 60 + im!)) / 6) / 10);
}

export async function punch(staffId: string, kind: "in" | "out") {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const existing = (
    await supabase.from("teacher_attendance").select("*").eq("staff_id", staffId).eq("date", today).maybeSingle()
  ).data as TeacherAttendance | null;

  if (kind === "in") {
    const late = now > "08:30";
    const row = {
      staff_id: staffId,
      date: today,
      punch_in: now,
      status: late ? "late" : "present",
      working_hours: 0,
    };
    unwrap(await supabase.from("teacher_attendance").upsert(row as never, { onConflict: "staff_id,date" }));
    return;
  }

  const punchIn = existing?.punch_in ?? "08:30";
  const hours = hoursBetween(punchIn, now);
  const status = hours < 5 ? "half_day" : now < "15:30" ? "early_departure" : (existing?.status ?? "present");
  unwrap(
    await supabase.from("teacher_attendance").upsert(
      {
        staff_id: staffId,
        date: today,
        punch_in: punchIn,
        punch_out: now,
        working_hours: hours,
        status,
      } as never,
      { onConflict: "staff_id,date" },
    ),
  );
}

/* --------------------------- regularization --------------------------- */

export type Regularization = {
  id: string;
  staff_id: string;
  attendance_id: string | null;
  date: string;
  reason: string;
  explanation: string;
  document_url: string | null;
  status: string;
  hr_note: string | null;
  email_body: string | null;
  created_at: string;
};

export async function listRegularizations(staffId?: string) {
  let q = supabase.from("regularization_requests").select("*");
  if (staffId) q = q.eq("staff_id", staffId);
  return unwrap(await q.order("created_at", { ascending: false })) as Regularization[];
}

/** Builds the professional HR-addressed request text stored with the record. */
export function buildHrEmail(input: {
  teacherName: string;
  employeeNo?: string | null;
  date: string;
  reason: string;
  explanation: string;
}) {
  return [
    "To: HR Team, Chrysalis High",
    `Subject: Attendance regularization request — ${input.teacherName} (${input.date})`,
    "",
    "Dear HR Team,",
    "",
    `I would like to request regularization of my attendance record dated ${input.date}. The record currently reflects "${input.reason}".`,
    "",
    input.explanation,
    "",
    "I request you to kindly review and regularize the record at your convenience. Please let me know if any further information or supporting documentation is required.",
    "",
    "Thank you for your consideration.",
    "",
    "Warm regards,",
    input.teacherName,
    input.employeeNo ? `Employee No: ${input.employeeNo}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function createRegularization(input: {
  staff_id: string;
  attendance_id?: string | null;
  date: string;
  reason: string;
  explanation: string;
  document_url?: string | null;
  email_body: string;
}) {
  unwrap(await supabase.from("regularization_requests").insert(input as never));
}

export async function updateRegularization(id: string, patch: { status: string; hr_note?: string | null }) {
  unwrap(await supabase.from("regularization_requests").update(patch as never).eq("id", id));
}

/* -------------------------------- notices -------------------------------- */

export type Notice = {
  id: string;
  title: string;
  body: string | null;
  scope: string;
  class_ids: string[];
  student_ids: string[];
  attachments: Attachment[];
  author_name: string | null;
  author_role: string;
  scheduled_for: string | null;
  published_at: string | null;
  pinned: boolean;
  created_at: string;
};

export async function listNotices() {
  return unwrap(
    await supabase.from("notice_items").select("*").order("published_at", { ascending: false }),
  ) as unknown as Notice[];
}

export type NoticeInput = {
  id?: string;
  title: string;
  body?: string | null;
  scope: "school" | "class" | "students";
  class_ids?: string[];
  student_ids?: string[];
  attachments?: Attachment[];
  author_name?: string | null;
  author_role?: string;
  scheduled_for?: string | null;
  published_at?: string | null;
  pinned?: boolean;
};

export async function saveNotice(input: NoticeInput) {
  unwrap(
    await supabase.from("notice_items").upsert({
      ...input,
      class_ids: input.class_ids ?? [],
      student_ids: input.student_ids ?? [],
      attachments: (input.attachments ?? []) as never,
    } as never),
  );
}

export async function deleteNotice(id: string) {
  unwrap(await supabase.from("notice_items").delete().eq("id", id));
}

/** Notices visible to one student (school-wide, their class, or targeted). */
export function noticesForStudent(notices: Notice[], student: Student | null) {
  if (!student) return notices.filter((n) => n.scope === "school");
  return notices.filter(
    (n) =>
      n.scope === "school" ||
      (n.scope === "class" && n.class_ids.includes(student.class_id)) ||
      (n.scope === "students" && n.student_ids.includes(student.id)),
  );
}

/* ------------------------------ CCE assessment ------------------------------ */

export type CceScholastic = {
  id: string;
  student_id: string;
  subject: string;
  term: string;
  fa1: number | null;
  fa2: number | null;
  sa1: number | null;
  fa3: number | null;
  fa4: number | null;
  sa2: number | null;
};

export type CceCoScholastic = {
  id: string;
  student_id: string;
  term: string;
  discipline: string | null;
  art_education: string | null;
  work_education: string | null;
  health_pe: string | null;
  life_skills: string | null;
  values_grade: string | null;
  participation: string | null;
};

export async function listCce(studentId: string) {
  const [sch, co] = await Promise.all([
    supabase.from("cce_scholastic").select("*").eq("student_id", studentId).order("subject"),
    supabase.from("cce_coscholastic").select("*").eq("student_id", studentId),
  ]);
  return {
    scholastic: (sch.data ?? []) as CceScholastic[],
    coScholastic: (co.data ?? []) as CceCoScholastic[],
  };
}

export async function saveScholastic(row: Partial<CceScholastic> & { student_id: string; subject: string; term: string }) {
  unwrap(
    await supabase
      .from("cce_scholastic")
      .upsert({ ...row, academic_year: ACADEMIC_YEAR } as never, {
        onConflict: "student_id,subject,term,academic_year",
      }),
  );
}

export async function saveCoScholastic(
  row: Partial<CceCoScholastic> & { student_id: string; term: string },
) {
  unwrap(
    await supabase
      .from("cce_coscholastic")
      .upsert({ ...row, academic_year: ACADEMIC_YEAR } as never, {
        onConflict: "student_id,term,academic_year",
      }),
  );
}

/* ---------------------------------- PUPA ---------------------------------- */

export type PupaReport = {
  id: string;
  student_id: string;
  class_id: string | null;
  staff_id: string | null;
  academic_year: string;
  term: string;
  strengths: string | null;
  improvements: string | null;
  observations: string | null;
  parent_support: string | null;
  remarks: string | null;
  status: string;
  submitted_at: string | null;
  updated_at: string;
};

export async function getPupa(studentId: string, term: string) {
  const { data } = await supabase
    .from("pupa_reports")
    .select("*")
    .eq("student_id", studentId)
    .eq("term", term)
    .eq("academic_year", ACADEMIC_YEAR)
    .maybeSingle();
  return (data ?? null) as PupaReport | null;
}

export async function listPupa(studentId: string) {
  return unwrap(
    await supabase.from("pupa_reports").select("*").eq("student_id", studentId).order("term"),
  ) as PupaReport[];
}

export async function savePupa(input: {
  student_id: string;
  class_id?: string | null;
  staff_id?: string | null;
  term: string;
  strengths?: string | null;
  improvements?: string | null;
  observations?: string | null;
  parent_support?: string | null;
  remarks?: string | null;
  status: "draft" | "final";
}) {
  unwrap(
    await supabase.from("pupa_reports").upsert(
      {
        ...input,
        academic_year: ACADEMIC_YEAR,
        submitted_at: input.status === "final" ? new Date().toISOString() : null,
      } as never,
      { onConflict: "student_id,academic_year,term" },
    ),
  );
}

/* ------------------------------ report cards ------------------------------ */

export type ReportCard = {
  id: string;
  student_id: string;
  term: string;
  file_url: string | null;
  overall_grade: string | null;
  percentage: number | null;
  published_on: string | null;
};

export async function listReportCards(studentId: string) {
  return unwrap(
    await supabase.from("report_cards").select("*").eq("student_id", studentId).order("published_on"),
  ) as ReportCard[];
}

/* ------------------------------ grade helpers ------------------------------ */

/** Shared CCE grade scale so teacher entry and student report cards agree. */
export function gradeFor(percentage: number | null | undefined) {
  if (percentage == null || Number.isNaN(percentage)) return { letter: "—", points: 0 };
  if (percentage >= 91) return { letter: "A+", points: 10 };
  if (percentage >= 81) return { letter: "A", points: 9 };
  if (percentage >= 71) return { letter: "B+", points: 8 };
  if (percentage >= 61) return { letter: "B", points: 7 };
  if (percentage >= 51) return { letter: "C+", points: 6 };
  if (percentage >= 41) return { letter: "C", points: 5 };
  if (percentage >= 33) return { letter: "D", points: 4 };
  return { letter: "E", points: 2 };
}

/** Term total: two formative assessments out of 20 each + one summative out of 100. */
export function subjectPercentage(row: CceScholastic) {
  const isTerm1 = row.term === "Term 1";
  const fa: (number | null)[] = [isTerm1 ? row.fa1 : row.fa3, isTerm1 ? row.fa2 : row.fa4];
  const sa = isTerm1 ? row.sa1 : row.sa2;
  const faScore = fa.reduce<number>((sum, v) => sum + (v ?? 0), 0); // out of 40
  const saScore = ((sa ?? 0) / 100) * 60; // scaled to 60
  const hasAny = fa.some((v) => v != null) || sa != null;
  if (!hasAny) return null;
  return Math.round((faScore + saScore) * 10) / 10;
}

export function overallPercentage(rows: CceScholastic[]) {
  const vals = rows.map(subjectPercentage).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

/* ------------------------------ file uploads ------------------------------ */

const BUCKET = "school-files";

/**
 * Uploads a file to the private school-files bucket and returns a long-lived
 * signed URL so attachments render in both portals without a public bucket.
 */
export async function uploadAttachment(file: File, folder = "attachments"): Promise<Attachment> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr) throw new Error(signErr.message);
  return { name: file.name, url: data.signedUrl, type: file.type };
}

/* --------------------------- student homework status --------------------------- */

/** Student-side submission toggle; one row per (homework, student). */
export async function setHomeworkStatus(input: {
  homework_id: string;
  student_id: string;
  status: "pending" | "submitted";
}) {
  unwrap(
    await supabase.from("homework_status").upsert(
      {
        homework_id: input.homework_id,
        student_id: input.student_id,
        status: input.status,
        submitted_at: input.status === "submitted" ? new Date().toISOString() : null,
      } as never,
      { onConflict: "homework_id,student_id" },
    ),
  );
}

/* ------------------------------ notice reads ------------------------------ */

export type NoticeRead = { notice_id: string; student_id: string; read_at: string };

/** Which notices a student has already opened (drives the unread dot). */
export async function listNoticeReads(studentId: string) {
  return unwrap(
    await supabase
      .from("notice_reads")
      .select("notice_id, student_id, read_at")
      .eq("student_id", studentId),
  ) as NoticeRead[];
}

export async function markNoticeRead(noticeId: string, studentId: string) {
  unwrap(
    await supabase
      .from("notice_reads")
      .upsert({ notice_id: noticeId, student_id: studentId } as never, {
        onConflict: "notice_id,student_id",
      }),
  );
}

export async function markAllNoticesRead(noticeIds: string[], studentId: string) {
  if (!noticeIds.length) return;
  unwrap(
    await supabase.from("notice_reads").upsert(
      noticeIds.map((notice_id) => ({ notice_id, student_id: studentId })) as never,
      { onConflict: "notice_id,student_id" },
    ),
  );
}

/* -------------------------------- timetable -------------------------------- */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Day = (typeof DAYS)[number];

export type TimetableSlot = {
  id: string;
  day: Day | string;
  period_no: number;
  start_time: string;
  end_time: string;
  subject: string;
  teacher: string;
  room: string;
};

export type Timetable = {
  id: string;
  class_id: string;
  academic_year: string;
  status: string;
  draft_slots: TimetableSlot[];
  published_slots: TimetableSlot[];
  updated_by_name: string | null;
  published_by_name: string | null;
  published_at: string | null;
  updated_at: string;
};

function normaliseTimetable(row: Record<string, unknown> | null): Timetable | null {
  if (!row) return null;
  return {
    ...(row as unknown as Timetable),
    draft_slots: (row['draft_slots'] as TimetableSlot[]) ?? [],
    published_slots: (row['published_slots'] as TimetableSlot[]) ?? [],
  };
}

export async function getTimetable(classId: string, academicYear = ACADEMIC_YEAR) {
  const { data, error } = await supabase
    .from("timetables")
    .select("*")
    .eq("class_id", classId)
    .eq("academic_year", academicYear)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return normaliseTimetable(data as never);
}

/** Editors save into draft_slots; students never read this column. */
export async function saveTimetableDraft(input: {
  classId: string;
  academicYear?: string;
  slots: TimetableSlot[];
  editorName: string;
}) {
  const row = {
    class_id: input.classId,
    academic_year: input.academicYear ?? ACADEMIC_YEAR,
    draft_slots: input.slots as never,
    status: "draft",
    updated_by_name: input.editorName,
    updated_at: new Date().toISOString(),
  };
  unwrap(
    await supabase.from("timetables").upsert(row as never, { onConflict: "class_id,academic_year" }),
  );
}

/** Copies the current draft into the published column students read. */
export async function publishTimetable(input: {
  classId: string;
  academicYear?: string;
  slots: TimetableSlot[];
  editorName: string;
}) {
  const now = new Date().toISOString();
  const row = {
    class_id: input.classId,
    academic_year: input.academicYear ?? ACADEMIC_YEAR,
    draft_slots: input.slots as never,
    published_slots: input.slots as never,
    status: "published",
    updated_by_name: input.editorName,
    published_by_name: input.editorName,
    published_at: now,
    updated_at: now,
  };
  unwrap(
    await supabase.from("timetables").upsert(row as never, { onConflict: "class_id,academic_year" }),
  );
}

export function sortSlots(slots: TimetableSlot[]) {
  const dayIndex = (d: string) => {
    const i = (DAYS as readonly string[]).indexOf(d);
    return i === -1 ? 99 : i;
  };
  return [...slots].sort(
    (a, b) => dayIndex(a.day) - dayIndex(b.day) || a.period_no - b.period_no || a.start_time.localeCompare(b.start_time),
  );
}

export function todayDay(): Day {
  const map: Day[] = ["Mon", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date().getDay(); // 0 = Sunday
  return map[d === 0 ? 0 : d] ?? "Mon";
}
