import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useGuestEntry } from "@/lib/guest-session";
import { usePerfMode } from "@/hooks/use-perf-mode";
import { useHydrated } from "@/hooks/use-hydrated";

const HIGHLIGHTS = [
  "Live notices, homework and attendance",
  "Fees, report cards and documents in one place",
  "Bus tracking and cafeteria menus",
];

/**
 * Guest access card — the credential form is intentionally absent for this
 * release. See `src/lib/guest-session.ts` for how login is re-enabled.
 */
export function AccessCard() {
  const { enter, pending, error } = useGuestEntry();

  return (
    <div className="rounded-[24px] border border-line bg-paper p-6 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)] sm:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
        Get started
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
        Students &amp; parents. No account needed — jump straight into the portal.
      </p>

      <ul className="mt-6 space-y-3" aria-label="What's inside">
        {HIGHLIGHTS.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-[color:var(--ink-soft)]">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--emerald)]"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => void enter()}
        disabled={pending}
        className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[color:var(--signal)] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--paper)] disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Preparing your portal…
          </>
        ) : (
          <>
            Enter the portal
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </>
        )}
      </button>

      <p aria-live="polite" className="mt-3 min-h-[16px] text-xs text-[color:var(--ember)]">
        {error}
      </p>

      <div className="mt-1 flex items-center justify-center gap-3 text-xs text-[color:var(--ink-soft)]">
        <span>Staff member?</span>
        <Link to="/teacher" className="font-medium text-[color:var(--signal)] hover:underline">
          Teacher
        </Link>
        <span aria-hidden>•</span>
        <Link to="/staff" className="font-medium text-[color:var(--signal)] hover:underline">
          Staff
        </Link>
      </div>
    </div>
  );
}

/** Hero: headline + supporting copy on the left, access card on the right. */
export function LandingHero() {
  const { disableAnimations } = usePerfMode();
  const hydrated = useHydrated();
  const still = disableAnimations || !hydrated;

  return (
    <section className="relative z-10 mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-10">
      <motion.div
        initial={still ? false : { opacity: 0, y: 18 }}
        animate={still ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--signal)]">
          Chrysalis Connect
        </span>
        <h1 className="mt-5 max-w-[15ch] font-display text-[40px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[56px] lg:text-[64px]">
          Everything your family needs from school, in one calm place.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-[color:var(--ink-soft)] sm:text-[17px]">
          Notices, homework, attendance, PTMs, bus tracking and more — for every child, across
          every Chrysalis campus.
        </p>
        <p className="mt-10 text-sm italic text-[color:var(--ink-soft)]">
          &ldquo;Preparing children for the exam called LIFE.&rdquo;
        </p>
      </motion.div>

      <motion.div
        initial={still ? false : { opacity: 0, y: 24 }}
        animate={still ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <AccessCard />
      </motion.div>
    </section>
  );
}
