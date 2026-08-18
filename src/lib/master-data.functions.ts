import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Student master-data import. Admin / superadmin only — the role check runs
 * server-side against user_roles, so a direct API call from a student or
 * teacher session is rejected regardless of what the UI shows.
 */

const rowSchema = z.object({
  rowNumber: z.number(),
  full_name: z.string().trim().min(1),
  admission_no: z.string().trim().optional().nullable(),
  grade: z.string().trim().min(1),
  section: z.string().trim().min(1),
  roll_no: z.number().int().nonnegative().optional().nullable(),
  dob: z.string().trim().optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  blood_group: z.string().trim().optional().nullable(),
  house: z.string().trim().optional().nullable(),
  father_name: z.string().trim().optional().nullable(),
  father_phone: z.string().trim().optional().nullable(),
  father_email: z.string().trim().optional().nullable(),
  father_occupation: z.string().trim().optional().nullable(),
  mother_name: z.string().trim().optional().nullable(),
  mother_phone: z.string().trim().optional().nullable(),
  mother_email: z.string().trim().optional().nullable(),
  mother_occupation: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export type MasterRow = z.infer<typeof rowSchema>;

const inputSchema = z.object({
  rows: z.array(rowSchema).min(1).max(2000),
  campusId: z.string().uuid().optional().nullable(),
});

export type ImportOutcome = {
  rowNumber: number;
  name: string;
  result: "created" | "updated" | "review" | "error";
  detail: string;
};

type Ctx = { supabase: any; userId: string };

async function resolveAdminCampus(ctx: Ctx, requested?: string | null) {
  const { data: roles } = await ctx.supabase
    .from("user_roles")
    .select("role, campus_id")
    .eq("user_id", ctx.userId);
  const list = (roles ?? []) as { role: string; campus_id: string | null }[];
  const isSystem = list.some((r) => r.role === "system_admin");
  const campusAdmin = list.find((r) => r.role === "campus_admin");
  if (!isSystem && !campusAdmin) {
    throw new Error("Forbidden: master data import requires an admin role.");
  }
  if (requested) {
    if (!isSystem && campusAdmin?.campus_id !== requested) {
      throw new Error("Forbidden: you can only import students for your own campus.");
    }
    return requested;
  }
  if (campusAdmin?.campus_id) return campusAdmin.campus_id;
  const { data: prof } = await ctx.supabase
    .from("profiles")
    .select("campus_id")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (prof?.campus_id) return prof.campus_id as string;
  throw new Error("No campus assigned to this admin account.");
}

function normalise(v: string | null | undefined) {
  return (v ?? "").trim().toLowerCase();
}

export const importStudentMasterData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const campusId = await resolveAdminCampus(ctx, data.campusId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: classRows } = await supabaseAdmin
      .from("classes")
      .select("id, grade, section")
      .eq("campus_id", campusId);
    const classes = new Map<string, string>();
    for (const c of classRows ?? []) {
      classes.set(`${normalise(c.grade)}|${normalise(c.section)}`, c.id);
    }

    const classIds = [...classes.values()];
    const { data: existing } = classIds.length
      ? await supabaseAdmin
          .from("students")
          .select("id, full_name, admission_no, class_id, roll_no")
          .in("class_id", classIds)
      : { data: [] as any[] };
    const roster = (existing ?? []) as {
      id: string;
      full_name: string;
      admission_no: string | null;
      class_id: string;
    }[];

    const outcomes: ImportOutcome[] = [];
    let created = 0;
    let updated = 0;

    for (const row of data.rows) {
      const key = `${normalise(row.grade)}|${normalise(row.section)}`;
      let classId = classes.get(key);
      if (!classId) {
        const { data: newClass, error: classErr } = await supabaseAdmin
          .from("classes")
          .insert({ campus_id: campusId, grade: row.grade.trim(), section: row.section.trim() })
          .select("id")
          .single();
        if (classErr || !newClass) {
          outcomes.push({
            rowNumber: row.rowNumber,
            name: row.full_name,
            result: "error",
            detail: classErr?.message ?? "Could not create class",
          });
          continue;
        }
        classId = newClass.id;
        classes.set(key, classId);
      }

      const admission = (row.admission_no ?? "").trim();
      let match = admission
        ? roster.find((s) => normalise(s.admission_no) === normalise(admission))
        : undefined;

      if (!match) {
        const nameMatches = roster.filter(
          (s) => normalise(s.full_name) === normalise(row.full_name) && s.class_id === classId,
        );
        if (nameMatches.length > 1) {
          outcomes.push({
            rowNumber: row.rowNumber,
            name: row.full_name,
            result: "review",
            detail: "Multiple students share this name in the class — resolve manually.",
          });
          continue;
        }
        if (nameMatches.length === 1) {
          match = nameMatches[0];
          if (admission && match.admission_no && normalise(match.admission_no) !== normalise(admission)) {
            outcomes.push({
              rowNumber: row.rowNumber,
              name: row.full_name,
              result: "review",
              detail: `Name matches an existing student with a different admission number (${match.admission_no}).`,
            });
            continue;
          }
        }
      }

      // Only send fields the spreadsheet actually provided, so existing data is preserved.
      const patch: Record<string, unknown> = { class_id: classId, full_name: row.full_name.trim() };
      const optional: [string, unknown][] = [
        ["admission_no", admission || undefined],
        ["roll_no", row.roll_no ?? undefined],
        ["dob", row.dob || undefined],
        ["gender", row.gender || undefined],
        ["blood_group", row.blood_group || undefined],
        ["house", row.house || undefined],
        ["father_name", row.father_name || undefined],
        ["father_phone", row.father_phone || undefined],
        ["father_email", row.father_email || undefined],
        ["father_occupation", row.father_occupation || undefined],
        ["mother_name", row.mother_name || undefined],
        ["mother_phone", row.mother_phone || undefined],
        ["mother_email", row.mother_email || undefined],
        ["mother_occupation", row.mother_occupation || undefined],
        ["address", row.address || undefined],
      ];
      for (const [k, v] of optional) if (v !== undefined) patch[k] = v;

      if (match) {
        const { error } = await supabaseAdmin.from("students").update(patch).eq("id", match.id);
        if (error) {
          outcomes.push({ rowNumber: row.rowNumber, name: row.full_name, result: "error", detail: error.message });
          continue;
        }
        updated += 1;
        outcomes.push({ rowNumber: row.rowNumber, name: row.full_name, result: "updated", detail: "Profile updated" });
      } else {
        const insert = {
          ...patch,
          admission_no: admission || `AUTO-${Date.now()}-${row.rowNumber}`,
          roll_no: row.roll_no ?? 0,
        };
        const { data: inserted, error } = await supabaseAdmin
          .from("students")
          .insert(insert as never)
          .select("id, full_name, admission_no, class_id")
          .single();
        if (error || !inserted) {
          outcomes.push({
            rowNumber: row.rowNumber,
            name: row.full_name,
            result: "error",
            detail: error?.message ?? "Insert failed",
          });
          continue;
        }
        roster.push(inserted as never);
        created += 1;
        outcomes.push({ rowNumber: row.rowNumber, name: row.full_name, result: "created", detail: "Profile created" });
      }
    }

    return {
      processed: data.rows.length,
      created,
      updated,
      review: outcomes.filter((o) => o.result === "review").length,
      errors: outcomes.filter((o) => o.result === "error").length,
      outcomes,
    };
  });
