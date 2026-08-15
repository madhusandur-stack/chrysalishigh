import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const appRoleSchema = z.enum(["student", "teacher", "campus_admin", "system_admin"]);

const demoRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters.").regex(/[A-Z]/, "Password needs an uppercase letter.").regex(/[a-z]/, "Password needs a lowercase letter.").regex(/[0-9]/, "Password needs a number."),
  role: appRoleSchema,
  campusId: z.string().uuid().nullable().optional(),
  grade: z.string().trim().max(24).optional(),
  section: z.string().trim().max(24).optional(),
  studentId: z.string().trim().max(48).optional(),
});

type DemoAccount = {
  email: string;
  password: string;
  role: z.infer<typeof appRoleSchema>;
  fullName: string;
  campusSlug?: string;
  studentId?: string;
  grade?: string;
  section?: string;
  house?: string;
  subject?: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [

  {
    email: "student.varthur@demo.chrysalisconnect.in",
    password: "Student@123",
    role: "student" as const,
    fullName: "Om Shant Kumar Tallalli",
    campusSlug: "varthur",
    studentId: "CHV-S00048",
    grade: "X",
    section: "C",
    house: "Challengers",
  },
  {
    email: "teacher.varthur@demo.chrysalisconnect.in",
    password: "Teacher@123",
    role: "teacher" as const,
    fullName: "Demo Teacher",
    campusSlug: "varthur",
  },
  {
    email: "panel.teacher@demo.chrysalisconnect.in",
    password: "Chrysalis#Teach2026",
    role: "teacher" as const,
    fullName: "Panel Demo Teacher",
    campusSlug: "varthur",
    subject: "Mathematics",
  },
  {
    email: "admin.varthur@demo.chrysalisconnect.in",
    password: "Admin@123",
    role: "campus_admin" as const,
    fullName: "Demo Campus Admin",
    campusSlug: "varthur",
  },
  {
    email: "panel.admin@demo.chrysalisconnect.in",
    password: "Chrysalis#Admin2026",
    role: "campus_admin" as const,
    fullName: "Panel Demo Admin",
    campusSlug: "varthur",
  },
  {
    email: "superadmin@demo.chrysalisconnect.in",
    password: "SuperAdmin@123",
    role: "system_admin" as const,
    fullName: "System Administrator",
  },
];


type AdminClient = Awaited<ReturnType<typeof getAdminClient>>;

async function getAdminClient() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin;
  } catch (error) {
    console.error("[demo-auth] Admin client unavailable", error);
    throw new Error("Demo account provisioning could not access the secure backend admin client. Check the service role secret in Lovable Cloud.");
  }
}

async function listAllUsers(admin: AdminClient) {
  const users: Array<{ id: string; email?: string | null; email_confirmed_at?: string | null }> = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Unable to read authentication users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function ensureProfileAndRole(
  admin: AdminClient,
  input: {
    userId: string;
    fullName: string;
    role: z.infer<typeof appRoleSchema>;
    campusId: string | null;
    studentId?: string | null;
    grade?: string | null;
    section?: string | null;
    house?: string | null;
  },
) {
  const { error: profileError } = await admin.from("profiles").upsert({
    id: input.userId,
    full_name: input.fullName,
    campus_id: input.campusId,
    student_id: input.studentId ?? null,
    grade: input.grade && input.section ? `${input.grade}-${input.section}` : input.grade ?? null,
    house: input.house ?? null,
  });
  if (profileError) throw new Error(`Profile could not be saved: ${profileError.message}`);

  const { error: deleteError } = await admin.from("user_roles").delete().eq("user_id", input.userId).eq("role", input.role);
  if (deleteError) throw new Error(`Existing role cleanup failed: ${deleteError.message}`);

  const { error: roleError } = await admin.from("user_roles").insert({
    user_id: input.userId,
    role: input.role,
    campus_id: input.role === "system_admin" ? null : input.campusId,
  });
  if (roleError) throw new Error(`Role could not be assigned: ${roleError.message}`);
}

export const seedDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const admin = await getAdminClient();
  const { data: campuses, error: campusesError } = await admin.from("campuses").select("id, slug");
  if (campusesError) throw new Error(`Could not load campuses: ${campusesError.message}`);
  const campusMap = new Map((campuses ?? []).map((campus) => [campus.slug, campus.id]));
  const users = await listAllUsers(admin);
  const results: Array<{ email: string; status: "created" | "updated"; userId: string }> = [];

  for (const account of DEMO_ACCOUNTS) {
    const campusId = account.campusSlug ? campusMap.get(account.campusSlug) : null;
    if (account.role !== "system_admin" && !campusId) throw new Error(`Campus not found for ${account.email}.`);
    const existing = users.find((user) => user.email?.toLowerCase() === account.email);
    const metadata = {
      full_name: account.fullName,
      campus_slug: account.campusSlug,
      student_id: account.studentId,
      grade: account.grade,
      section: account.section,
      house: account.house,
      demo: true,
    };
    let { data, error } = existing
      ? await admin.auth.admin.updateUserById(existing.id, {
          password: account.password,
          email_confirm: true,
          user_metadata: metadata,
        })
      : await admin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: metadata,
        });
    // Existing legacy demo logins may use a password the auth service now rejects
    // as weak — keep the account usable instead of failing the whole seed.
    if (error && existing && /weak|pwned|breach/i.test(error.message)) {
      ({ data, error } = await admin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        user_metadata: metadata,
      }));
    }
    if (error || !data.user) throw new Error(`${account.email}: ${error?.message ?? "Auth user was not returned."}`);

    await ensureProfileAndRole(admin, {
      userId: data.user.id,
      fullName: account.fullName,
      role: account.role,
      campusId: campusId ?? null,
      studentId: account.studentId ?? null,
      grade: account.grade ?? null,
      section: account.section ?? null,
      house: account.house ?? null,
    });
    if ((account.role === "teacher" || account.role === "campus_admin") && campusId) {
      const { data: staffRow } = await admin
        .from("staff_members")
        .select("id")
        .eq("email", account.email)
        .maybeSingle();
      const payload = {
        campus_id: campusId,
        user_id: data.user.id,
        full_name: account.fullName,
        email: account.email,
        role: account.role,
        subject: account.subject ?? null,
      };
      if (staffRow) {
        await admin.from("staff_members").update(payload).eq("id", staffRow.id);
      } else {
        await admin.from("staff_members").insert(payload);
      }
    }
    results.push({ email: account.email, status: existing ? "updated" : "created", userId: data.user.id });
  }


  return { ok: true, results };
});

export const createDevelopmentAccount = createServerFn({ method: "POST" })
  .inputValidator((input) => demoRegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    const admin = await getAdminClient();
    if (data.role !== "system_admin" && !data.campusId) throw new Error("Campus is required for this account type.");
    const generatedStudentId = data.role === "student" ? data.studentId || `CHV-${Date.now().toString().slice(-7)}` : null;
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        demo: true,
        grade: data.grade,
        section: data.section,
        student_id: generatedStudentId,
      },
    });
    if (authError || !authData.user) {
      console.error("[demo-auth] Development account creation failed", authError);
      throw new Error(authError?.message ?? "The auth user was not created.");
    }
    try {
      await ensureProfileAndRole(admin, {
        userId: authData.user.id,
        fullName: data.fullName,
        role: data.role,
        campusId: data.role === "system_admin" ? null : data.campusId ?? null,
        studentId: generatedStudentId,
        grade: data.grade,
        section: data.section,
      });
    } catch (error) {
      console.error("[demo-auth] Rolling back partially created development account", error);
      await admin.auth.admin.deleteUser(authData.user.id);
      throw error;
    }
    return { ok: true, email: data.email, role: data.role };
  });