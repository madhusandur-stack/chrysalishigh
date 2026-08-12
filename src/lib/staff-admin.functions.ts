import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Ctx = { supabase: any; userId: string };

async function assertCampusAdmin(ctx: Ctx, campusId: string) {
  const { data: isSystem } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "system_admin",
  });
  if (isSystem) return;
  const { data: isAdmin } = await ctx.supabase.rpc("has_campus_role", {
    _user_id: ctx.userId,
    _role: "campus_admin",
    _campus_id: campusId,
  });
  if (!isAdmin) throw new Error("Forbidden: not a campus admin for this campus.");
}

async function loadAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function resolveActingCampus(ctx: Ctx, requested: string | null | undefined) {
  if (requested) {
    await assertCampusAdmin(ctx, requested);
    return requested;
  }
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("campus_id, role")
    .eq("user_id", ctx.userId);
  const admin = (data ?? []).find((r: any) => r.role === "campus_admin" && r.campus_id);
  if (!admin) throw new Error("No campus assigned. Ask a system admin to grant access.");
  return admin.campus_id as string;
}

/* ---------------- Stats ---------------- */
export const getCampusStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campusId?: string | null }) => input ?? {})
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const [students, teachers, classes, notices, homework] = await Promise.all([
      admin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student")
        .eq("campus_id", campusId),
      admin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "teacher")
        .eq("campus_id", campusId),
      admin.from("classes").select("id", { count: "exact", head: true }).eq("campus_id", campusId),
      admin.from("notices").select("id", { count: "exact", head: true }).eq("campus_id", campusId),
      admin
        .from("homework")
        .select("id, title, created_at, class_id, classes!inner(campus_id)")
        .eq("classes.campus_id", campusId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    return {
      campusId,
      counts: {
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
        classes: classes.count ?? 0,
        notices: notices.count ?? 0,
      },
      recentHomework: homework.data ?? [],
    };
  });

/* ---------------- List users ---------------- */
export const listCampusUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { campusId?: string | null; role: "student" | "teacher"; search?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: roleRows, error } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", data.role)
      .eq("campus_id", campusId);
    if (error) throw new Error(error.message);
    const ids = (roleRows ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) return { campusId, users: [] as any[] };
    let query = admin
      .from("profiles")
      .select("id, full_name, student_id, grade, house, avatar_url, created_at, campus_id")
      .in("id", ids)
      .order("full_name", { ascending: true });
    if (data.search && data.search.trim()) {
      const q = data.search.trim();
      query = query.or(`full_name.ilike.%${q}%,student_id.ilike.%${q}%`);
    }
    const { data: profiles, error: pErr } = await query;
    if (pErr) throw new Error(pErr.message);
    return { campusId, users: profiles ?? [] };
  });

/* ---------------- Create user ---------------- */
const createUserSchema = z.object({
  campusId: z.string().uuid().nullable().optional(),
  role: z.enum(["student", "teacher"]),
  fullName: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
  studentId: z.string().trim().max(48).optional(),
  grade: z.string().trim().max(24).optional(),
  house: z.string().trim().max(48).optional(),
});

export const createCampusUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (authErr || !authData.user)
      throw new Error(authErr?.message ?? "Auth user was not created.");
    try {
      const { error: pErr } = await admin.from("profiles").upsert({
        id: authData.user.id,
        full_name: data.fullName,
        campus_id: campusId,
        student_id: data.role === "student" ? (data.studentId ?? null) : null,
        grade: data.grade ?? null,
        house: data.house ?? null,
      });
      if (pErr) throw pErr;
      const { error: rErr } = await admin.from("user_roles").insert({
        user_id: authData.user.id,
        role: data.role,
        campus_id: campusId,
      });
      if (rErr) throw rErr;
    } catch (e) {
      await admin.auth.admin.deleteUser(authData.user.id);
      throw e instanceof Error ? e : new Error(String(e));
    }
    return { ok: true, id: authData.user.id, email: data.email };
  });

/* ---------------- Delete user ---------------- */
export const deleteCampusUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campusId?: string | null; userId: string }) => input)
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    // Verify target belongs to this campus
    const { data: roles } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", data.userId)
      .eq("campus_id", campusId);
    if (!roles || roles.length === 0) throw new Error("User is not in this campus.");
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Classes ---------------- */
export const listCampusClasses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campusId?: string | null } = {}) => input)
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: classes, error } = await admin
      .from("classes")
      .select("id, grade, section, subject, class_teacher_id, created_at")
      .eq("campus_id", campusId)
      .order("grade", { ascending: true });
    if (error) throw new Error(error.message);
    const ids = (classes ?? []).map((c: any) => c.id);
    let enrolCounts: Record<string, number> = {};
    if (ids.length) {
      const { data: enrols } = await admin
        .from("student_enrollments")
        .select("class_id")
        .in("class_id", ids);
      for (const r of enrols ?? []) enrolCounts[r.class_id] = (enrolCounts[r.class_id] ?? 0) + 1;
    }
    const teacherIds = Array.from(
      new Set((classes ?? []).map((c: any) => c.class_teacher_id).filter(Boolean)),
    );
    let teachers: Record<string, string> = {};
    if (teacherIds.length) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds);
      for (const p of profs ?? []) teachers[p.id] = p.full_name ?? "—";
    }
    return {
      campusId,
      classes: (classes ?? []).map((c: any) => ({
        ...c,
        student_count: enrolCounts[c.id] ?? 0,
        teacher_name: c.class_teacher_id ? (teachers[c.class_teacher_id] ?? null) : null,
      })),
    };
  });

const createClassSchema = z.object({
  campusId: z.string().uuid().nullable().optional(),
  grade: z.string().trim().min(1).max(24),
  section: z.string().trim().min(1).max(24),
  subject: z.string().trim().max(48).optional(),
});

export const createClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createClassSchema.parse(input))
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: row, error } = await admin
      .from("classes")
      .insert({
        campus_id: campusId,
        grade: data.grade,
        section: data.section,
        subject: data.subject ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campusId?: string | null; classId: string }) => input)
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: cls } = await admin
      .from("classes")
      .select("id")
      .eq("id", data.classId)
      .eq("campus_id", campusId)
      .maybeSingle();
    if (!cls) throw new Error("Class not in this campus.");
    const { error } = await admin.from("classes").delete().eq("id", data.classId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Notices ---------------- */
export const listCampusNotices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campusId?: string | null } = {}) => input)
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: notices, error } = await admin
      .from("notices")
      .select("id, title, body, pinned, audience, created_at, author_id")
      .eq("campus_id", campusId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const authorIds = Array.from(
      new Set((notices ?? []).map((n: any) => n.author_id).filter(Boolean)),
    );
    let authors: Record<string, string> = {};
    if (authorIds.length) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", authorIds);
      for (const p of profs ?? []) authors[p.id] = p.full_name ?? "—";
    }
    return {
      campusId,
      notices: (notices ?? []).map((n: any) => ({
        ...n,
        author_name: authors[n.author_id] ?? "—",
      })),
    };
  });

const createNoticeSchema = z.object({
  campusId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().max(4000).optional(),
  pinned: z.boolean().optional(),
  audience: z.enum(["campus", "students", "teachers", "parents"]).optional(),
});

export const createNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createNoticeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: row, error } = await admin
      .from("notices")
      .insert({
        campus_id: campusId,
        author_id: (context as Ctx).userId,
        title: data.title,
        body: data.body ?? null,
        pinned: data.pinned ?? false,
        audience: data.audience ?? "campus",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campusId?: string | null; noticeId: string }) => input)
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { error } = await admin
      .from("notices")
      .delete()
      .eq("id", data.noticeId)
      .eq("campus_id", campusId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Attendance overview ---------------- */
export const getAttendanceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campusId?: string | null } = {}) => input)
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();
    const { data: classes } = await admin
      .from("classes")
      .select("id, grade, section")
      .eq("campus_id", campusId);
    const classIds = (classes ?? []).map((c: any) => c.id);
    if (classIds.length === 0) return { campusId, days: [], classes: [] };
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const sinceStr = since.toISOString().slice(0, 10);
    const { data: records } = await admin
      .from("attendance_records")
      .select("class_id, date, status")
      .in("class_id", classIds)
      .gte("date", sinceStr);
    const byDay: Record<string, { present: number; absent: number; late: number; total: number }> =
      {};
    const byClass: Record<string, { present: number; total: number }> = {};
    const today = new Date().toISOString().slice(0, 10);
    for (const r of records ?? []) {
      const d = byDay[r.date] ?? { present: 0, absent: 0, late: 0, total: 0 };
      d.total++;
      if (r.status === "present") d.present++;
      else if (r.status === "late") d.late++;
      else d.absent++;
      byDay[r.date] = d;
      if (r.date === today) {
        const c = byClass[r.class_id] ?? { present: 0, total: 0 };
        c.total++;
        if (r.status === "present") c.present++;
        byClass[r.class_id] = c;
      }
    }
    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const d = byDay[key] ?? { present: 0, absent: 0, late: 0, total: 0 };
      days.push({
        date: key,
        ...d,
        rate: d.total ? Math.round((d.present / d.total) * 100) : null,
      });
    }
    const classRows = (classes ?? []).map((c: any) => {
      const s = byClass[c.id] ?? { present: 0, total: 0 };
      return {
        id: c.id,
        grade: c.grade,
        section: c.section,
        present: s.present,
        total: s.total,
        rate: s.total ? Math.round((s.present / s.total) * 100) : null,
      };
    });
    return { campusId, days, classes: classRows };
  });

/* ---------------- Homework oversight ---------------- */
const listHomeworkSchema = z.object({
  campusId: z.string().uuid().nullable().optional(),
  search: z.string().trim().max(120).optional(),
  grade: z.string().trim().max(24).optional(),
  teacherId: z.string().uuid().optional(),
});

export const listCampusHomework = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listHomeworkSchema.parse(input))
  .handler(async ({ data, context }) => {
    const campusId = await resolveActingCampus(context as Ctx, data.campusId ?? null);
    const admin = await loadAdminClient();

    const { data: classes } = await admin
      .from("classes")
      .select("id, grade, section")
      .eq("campus_id", campusId);
    const classIds = (classes ?? []).map((c: any) => c.id);
    if (classIds.length === 0)
      return { campusId, homework: [] as any[], teachers: [] as any[], grades: [] as string[] };

    let query = admin
      .from("homework")
      .select(
        "id, title, subject, description, due_date, status, created_at, teacher_id, class_id, classes!inner(grade, section)",
      )
      .in("class_id", classIds)
      .order("created_at", { ascending: false });

    if (data.grade) {
      query = query.eq("classes.grade", data.grade);
    }
    if (data.teacherId) {
      query = query.eq("teacher_id", data.teacherId);
    }
    if (data.search && data.search.trim()) {
      const q = data.search.trim();
      query = query.or(`title.ilike.%${q}%,subject.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data: homework, error } = await query.limit(200);
    if (error) throw new Error(error.message);

    const teacherIds = Array.from(
      new Set((homework ?? []).map((h: any) => h.teacher_id).filter(Boolean)),
    );
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", teacherIds);
    const teachersMap: Record<string, string> = {};
    for (const p of profiles ?? []) teachersMap[p.id] = p.full_name ?? "—";

    const gradesSet = new Set<string>();
    for (const h of homework ?? []) {
      const cls = h.classes as { grade: string; section: string } | null;
      if (cls?.grade) gradesSet.add(cls.grade);
    }

    return {
      campusId,
      homework: (homework ?? []).map((h: any) => ({
        ...h,
        teacher_name: teachersMap[h.teacher_id] ?? "—",
        class_grade: (h.classes as { grade?: string })?.grade ?? "—",
        class_section: (h.classes as { section?: string })?.section ?? "—",
      })),
      teachers: Object.entries(teachersMap).map(([id, full_name]) => ({ id, full_name })),
      grades: Array.from(gradesSet).sort(),
    };
  });
