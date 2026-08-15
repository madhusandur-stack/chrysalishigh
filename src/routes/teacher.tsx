import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { DevelopmentAccountPanel, LoginShell, DemoAccountsPanel } from "@/components/auth/login-shell";
import { CampusSelectorField } from "@/components/auth/campus-selector-field";
import { listCampuses } from "@/lib/campuses.functions";
import { SmoothInput, SmoothPasswordInput } from "@/components/ui/smooth-input";

export const Route = createFileRoute("/teacher")({
  ssr: false,
  component: TeacherLogin,
});

function TeacherLogin() {
  const navigate = useNavigate();
  const listFn = useServerFn(listCampuses);
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: () => listFn() });

  const [campusId, setCampusId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!campusId) {
      setError("Please select your campus first.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      // Verify teacher role AND campus match
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role, campus_id")
        .eq("user_id", data.user!.id);
      const teacherRow = (roles ?? []).find((r) => r.role === "teacher");
      const isSysAdmin = (roles ?? []).some((r) => r.role === "system_admin");
      if (!teacherRow && !isSysAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account is not a teacher account.");
      }
      if (teacherRow && teacherRow.campus_id !== campusId && !isSysAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not belong to the selected campus.");
      }
      navigate({ to: "/teacher-portal" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginShell
      eyebrow="Teacher Portal"
      title="Teacher sign in"
      subtitle="Choose your campus and sign in with your school email."
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 text-xs text-[color:var(--ink-soft)]">
            <Link to="/auth" className="hover:text-[color:var(--ink)]">Student login</Link>
            <span>•</span>
            <Link to="/staff" className="hover:text-[color:var(--ink)]">Staff login</Link>
          </div>
          <DemoAccountsPanel
            accounts={[
              { label: "Teacher Panel · Varthur", email: "panel.teacher@demo.chrysalisconnect.in", password: "PanelTeacher@123", redirectTo: "/teacher-portal" },
              { label: "Teacher · Varthur", email: "teacher.varthur@demo.chrysalisconnect.in", password: "Teacher@123", redirectTo: "/teacher-portal" },
            ]}
          />

          <DevelopmentAccountPanel kind="teacher" campuses={campuses} />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Campus</label>
          <CampusSelectorField value={campusId} onChange={setCampusId} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">School email</label>
          <SmoothInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="teacher.varthur@demo.chrysalisconnect.in"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Password</label>
          <SmoothPasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
          />
        </div>
        {error && (
          <div className="rounded-[10px] border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-xs text-[color:var(--ember)]">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[14px] bg-[color:var(--signal)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "…" : "Sign in"}
        </button>
      </form>
    </LoginShell>
  );
}
