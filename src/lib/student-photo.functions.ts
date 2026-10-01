import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const uploadStudentPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        studentId: z.string().uuid(),
        mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z.string().min(10).max(7_500_000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: isTeacher }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "teacher" }),
      supabase.rpc("is_admin", { _user_id: userId }),
    ]);
    if (!isTeacher && !isAdmin) throw new Error("Only teachers and admins can upload student photos.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, classes(campus_id)")
      .eq("id", data.studentId)
      .maybeSingle();
    if (!student) throw new Error("Student not found.");
    const campusId = (student.classes as { campus_id: string } | null)?.campus_id;

    const { data: isSystem } = await supabase.rpc("has_role", { _user_id: userId, _role: "system_admin" });
    if (!isSystem) {
      const { data: staff } = await supabaseAdmin
        .from("staff_members")
        .select("campus_id")
        .eq("user_id", userId)
        .maybeSingle();
      const { data: roleRows } = await supabaseAdmin
        .from("user_roles")
        .select("campus_id")
        .eq("user_id", userId);
      const campuses = new Set([staff?.campus_id, ...(roleRows ?? []).map((r) => r.campus_id)].filter(Boolean));
      if (!campusId || !campuses.has(campusId)) throw new Error("This student is not in your campus.");
    }

    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Photo must be under 5 MB.");
    const path = `student-photos/${data.studentId}/profile-${Date.now()}.${MIME[data.mime]}`;
    const up = await supabaseAdmin.storage.from("school-files").upload(path, bytes, {
      contentType: data.mime,
      upsert: true,
    });
    if (up.error) throw new Error("Upload failed. Please try again.");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("school-files")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (sErr || !signed) throw new Error("Could not create photo link.");
    const { error } = await supabaseAdmin.from("students").update({ photo_url: signed.signedUrl }).eq("id", data.studentId);
    if (error) throw new Error("Could not save photo.");
    return { photoUrl: signed.signedUrl };
  });
