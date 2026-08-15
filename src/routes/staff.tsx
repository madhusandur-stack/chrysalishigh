import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { DevelopmentAccountPanel, LoginShell, DemoAccountsPanel } from "@/components/auth/login-shell";
import { CampusSelectorField } from "@/components/auth/campus-selector-field";
import { listCampuses } from "@/lib/campuses.functions";
import { SmoothInput, SmoothPasswordInput } from "@/components/ui/smooth-input";

export const Route = createFileRoute("/staff")({
  ssr: false,
  component: StaffLogin,
});

function StaffLogin() {
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
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role, campus_id")
        .eq("user_id", data.user!.id);
      const adminRow = (roles ?? []).find((r) => r.role === "campus_admin");
      const isSysAdmin = (roles ?? []).some((r) => r.role === "system_admin");
      if (!adminRow && !isSysAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account is not a staff account.");
      }
      if (adminRow && !isSysAdmin && !campusId) {
        await supabase.auth.signOut();
        throw new Error("Please select your campus first.");
      }
      if (adminRow && adminRow.campus_id !== campusId && !isSysAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not belong to the selected campus.");
      }
      navigate({ to: "/staff-portal" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginShell
      eyebrow="Staff & Admin Portal"
      title="Staff & Admin Portal"
      subtitle="Campus administrators and system admins can sign in with high-contrast, theme-aware access."
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 text-xs text-[color:var(--ink-soft)]">
            <Link to="/auth" className="hover:text-[color:var(--ink)]">Student login</Link>
            <span>•</span>
            <Link to="/teacher" className="hover:text-[color:var(--ink)]">Teacher login</Link>
          </div>
          <DemoAccountsPanel
            accounts={[
              { label: "Admin Panel · Varthur", email: "panel.admin@demo.chrysalisconnect.in", password: "PanelAdmin@123", redirectTo: "/staff-portal" },
              { label: "Campus Admin · Varthur", email: "admin.varthur@demo.chrysalisconnect.in", password: "Admin@123", redirectTo: "/staff-portal" },
              { label: "System Administrator", email: "superadmin@demo.chrysalisconnect.in", password: "SuperAdmin@123", redirectTo: "/staff-portal" },
            ]}
          />

          <DevelopmentAccountPanel kind="staff" campuses={campuses} />
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
            placeholder="admin.varthur@demo.chrysalisconnect.in"
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
