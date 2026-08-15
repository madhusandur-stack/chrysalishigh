import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChrysalisLogo } from "@/components/portal/logo";
import { SoftAurora } from "@/components/portal/aurora";
import { CampusSelector, type CampusOption } from "@/components/auth/campus-selector";
import { SmoothInput, SmoothPasswordInput } from "@/components/ui/smooth-input";
import { createDevelopmentAccount } from "@/lib/dev-auth.functions";
import { seedDemoAccounts } from "@/lib/demo-seed.functions";

import { useTheme } from "@/lib/theme";
import { usePerfMode } from "@/hooks/use-perf-mode";
import { useHydrated } from "@/hooks/use-hydrated";
import { supabase } from "@/integrations/supabase/client";

export function LoginShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  const { disableAnimations } = usePerfMode();
  const hydrated = useHydrated();
  const motionDisabled = disableAnimations || !hydrated;
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      <SoftAurora />
      <button
        type="button"
        onClick={toggle}
        className="glass absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
      >
        {hydrated ? (
          <>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span className="sr-only">Toggle theme</span>
          </>
        )}
      </button>
      <motion.div
        initial={motionDisabled ? false : { opacity: 0, y: 12 }}
        animate={motionDisabled ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center gap-4">
          <ChrysalisLogo className="h-14 sm:h-16" />
          <span className="mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--signal)]">
            {eyebrow}
          </span>
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-8 shadow-xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">{subtitle}</p>
          <div className="mt-6 space-y-4">{children}</div>
        </div>

        {footer && <div className="mt-4">{footer}</div>}
      </motion.div>
    </div>
  );
}

type DevAccountKind = "student" | "teacher" | "staff";

export function DevelopmentAccountPanel({
  kind,
  campuses,
}: {
  kind: DevAccountKind;
  campuses: CampusOption[];
}) {
  const navigate = useNavigate();
  const createAccount = useServerFn(createDevelopmentAccount);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [campusId, setCampusId] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [studentId, setStudentId] = useState("");
  const [staffRole, setStaffRole] = useState<"campus_admin" | "system_admin">("campus_admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStudent = kind === "student";
  const isTeacher = kind === "teacher";
  const role = isStudent ? "student" : isTeacher ? "teacher" : staffRole;
  const needsCampus = role !== "system_admin";

  const title = isStudent
    ? "Don't have a demo account? Create one"
    : isTeacher
      ? "Create Demo Teacher Account"
      : "Create Demo Staff Account";

  function validate() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return "Password must be 8+ characters with uppercase, lowercase, and a number.";
    }
    if (password !== confirmPassword) return "Passwords do not match.";
    if (needsCampus && !campusId) return "Please select a campus.";
    if (isStudent && (!grade.trim() || !section.trim())) return "Grade and section are required.";
    return null;
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;
    setSubmitting(true);
    try {
      await createAccount({
        data: {
          fullName,
          email,
          password,
          role,
          campusId: needsCampus ? campusId : null,
          grade: isStudent ? grade : undefined,
          section: isStudent ? section : undefined,
          studentId: isStudent ? studentId : undefined,
        },
      });
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      toast.success("Demo account created and signed in.");
      navigate({
        to:
          role === "teacher"
            ? "/teacher-portal"
            : role === "campus_admin" || role === "system_admin"
              ? "/staff-portal"
              : "/dashboard",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[demo-auth] Development account registration failed", err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-dashed border-line bg-paper/70">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="mono block text-[10px] uppercase tracking-[0.16em] text-[color:var(--ember)]">
            Development Only
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="h-4 w-4 text-[color:var(--ink-soft)]" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <form onSubmit={handleCreate} className="space-y-4 border-t border-line px-4 py-4">
          <Field label="Full Name">
            <SmoothInput
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
              autoComplete="name"
            />
          </Field>
          <Field label={isTeacher || kind === "staff" ? "School Email" : "Email Address"}>
            <SmoothInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@demo.chrysalisconnect.in"
              required
              autoComplete="email"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password">
              <SmoothPasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm Password">
              <SmoothPasswordInput
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm"
                required
                autoComplete="new-password"
              />
            </Field>
          </div>
          {kind === "staff" && (
            <Field label="Role">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["campus_admin", "Campus Administrator"],
                    ["system_admin", "System Administrator"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setStaffRole(value)}
                    className={`rounded-[12px] border px-3 py-2 text-xs font-semibold transition ${staffRole === value ? "border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal)]" : "border-line bg-paper text-[color:var(--ink-soft)]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {needsCampus && (
            <Field label="Campus">
              <CampusSelector campuses={campuses} value={campusId} onChange={setCampusId} />
            </Field>
          )}
          {isStudent && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Grade">
                  <SmoothInput
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    placeholder="X"
                    required
                  />
                </Field>
                <Field label="Section">
                  <SmoothInput
                    value={section}
                    onChange={(event) => setSection(event.target.value)}
                    placeholder="C"
                    required
                  />
                </Field>
              </div>
              <Field label="Student ID">
                <SmoothInput
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="Auto-generate if left blank"
                />
              </Field>
            </>
          )}
          {error && (
            <div className="rounded-[12px] border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-xs text-[color:var(--ember)]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[14px] bg-[color:var(--signal)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create and sign in"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-[color:var(--ink-soft)]">{label}</span>
      {children}
    </label>
  );
}

export type DemoAccount = {
  label: string;
  email: string;
  password: string;
  /** Where a one-click sign-in should land. */
  redirectTo?: "/dashboard" | "/teacher-portal" | "/staff-portal";
};

export function DemoAccountsPanel({ accounts }: { accounts: DemoAccount[] }) {
  const navigate = useNavigate();
  const seed = useServerFn(seedDemoAccounts);
  const [busy, setBusy] = useState<string | null>(null);

  async function provision() {
    setBusy("provision");
    try {
      const res = await seed({});
      toast.success(`${res.results.length} demo accounts ready.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function signIn(account: DemoAccount) {
    setBusy(account.email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (error) throw error;
      navigate({ to: account.redirectTo ?? "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <details className="group rounded-[14px] border border-dashed border-line bg-paper/60 p-4 text-sm">
      <summary className="flex cursor-pointer items-center justify-between font-medium text-[color:var(--ink-soft)]">
        <span>Development demo accounts</span>
        <span className="mono text-[10px] uppercase tracking-wider">Dev only</span>
      </summary>
      <div className="mt-3 space-y-2">
        {accounts.map((a) => (
          <div key={a.email} className="rounded-[10px] border border-line bg-paper p-3 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ink-soft)]">
                  {a.label}
                </div>
                <div className="mono mt-1 truncate">{a.email}</div>
                <div className="mono text-[color:var(--ink-soft)]">{a.password}</div>
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => signIn(a)}
                className="shrink-0 rounded-[10px] border border-line px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--signal)] transition hover:bg-[color:var(--signal-soft)] disabled:opacity-50"
              >
                {busy === a.email ? "…" : "Sign in"}
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={busy !== null}
          onClick={provision}
          className="w-full rounded-[10px] border border-dashed border-line px-3 py-2 text-[11px] text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)] disabled:opacity-50"
        >
          {busy === "provision" ? "Provisioning…" : "Provision / reset these demo accounts"}
        </button>
      </div>
    </details>
  );
}

