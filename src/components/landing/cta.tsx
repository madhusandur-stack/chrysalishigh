import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useGuestEntry } from "@/lib/guest-session";

/** Closing call to action — reuses the same guest entry flow as the hero. */
export function LandingCta() {
  const { enter, pending } = useGuestEntry();

  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8 lg:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-[28px] border border-line bg-paper px-6 py-12 text-center shadow-[var(--shadow-card)] sm:px-12 sm:py-16"
      >
        <h2 className="mx-auto max-w-2xl font-display text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[38px]">
          Ready to see your child's school day?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[color:var(--ink-soft)]">
          Open the portal instantly as a guest — no sign-up, no passwords, nothing to remember.
        </p>
        <button
          type="button"
          onClick={() => void enter()}
          disabled={pending}
          className="group mt-8 inline-flex items-center justify-center gap-2 rounded-[16px] bg-[color:var(--signal)] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--paper)] disabled:opacity-60"
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
      </motion.div>
    </section>
  );
}
