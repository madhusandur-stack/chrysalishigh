import { Link } from "@tanstack/react-router";

/** Landing footer with the school motto and credits. */
export function LandingFooter() {
  return (
    <footer className="border-t border-line px-5 py-10 text-center sm:px-8">
      <p className="text-sm italic text-[color:var(--ink-soft)]">
        &ldquo;Preparing children for the exam called LIFE.&rdquo;
      </p>
      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
        Made by Om and Eshaan from XC (CHV) (2026–27)
      </p>
      <nav
        aria-label="Footer"
        className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[color:var(--ink-soft)]"
      >
        <Link to="/teacher" className="hover:text-[color:var(--ink)]">
          Teacher login
        </Link>
        <span aria-hidden>•</span>
        <Link to="/staff" className="hover:text-[color:var(--ink)]">
          Staff login
        </Link>
        <span aria-hidden>•</span>
        <Link to="/auth" className="hover:text-[color:var(--ink)]">
          Account sign in
        </Link>
      </nav>
    </footer>
  );
}
