import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { DevelopmentAccountPanel, LoginShell, DemoAccountsPanel } from "@/components/auth/login-shell";
import { listCampuses } from "@/lib/campuses.functions";
import { SmoothInput, SmoothPasswordInput } from "@/components/ui/smooth-input";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listCampuses);
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: () => listFn() });


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginShell
      eyebrow="Student & Parent Portal"
      title={mode === "signin" ? "Welcome back" : "Create your account"}
      subtitle={
        mode === "signin"
          ? "Sign in with your Chrysalis account."
          : "Set up access for a student or parent."
      }
      footer={
        <div className="space-y-3">
          <div className="text-center text-sm text-[color:var(--ink-soft)]">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-[color:var(--signal)] hover:underline"
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-[color:var(--ink-soft)]">
            <Link to="/teacher" className="hover:text-[color:var(--ink)]">Teacher login</Link>
            <span>•</span>
            <Link to="/staff" className="hover:text-[color:var(--ink)]">Staff login</Link>
          </div>
          <DemoAccountsPanel
            accounts={[
              { label: "Student · Varthur", email: "student.varthur@demo.chrysalisconnect.in", password: "Student@123", redirectTo: "/dashboard" },
            ]}
          />

          <DevelopmentAccountPanel kind="student" campuses={campuses} />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Full name</label>
            <SmoothInput
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Full name"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Email</label>
          <SmoothInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="student.varthur@demo.chrysalisconnect.in"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">Password</label>
          <SmoothPasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
          {submitting ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </LoginShell>
  );
}

