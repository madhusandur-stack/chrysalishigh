import { Link } from "@tanstack/react-router";
import { ChrysalisLogo } from "@/components/portal/logo";
import { ThemeToggle } from "@/components/landing/theme-toggle";

/** Landing navigation: brand block on the left, portal links + theme on the right. */
export function LandingNav() {
  return (
    <header className="relative z-20">
      <nav
        aria-label="Main"
        className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-8 sm:py-7"
      >
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <ChrysalisLogo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
              Chrysalis Connect
            </span>
            <span className="hidden truncate text-xs text-[color:var(--ink-soft)] sm:block">
              Preparing children for the exam called LIFE.
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/teacher"
            className="rounded-full px-3 py-2 text-sm font-medium text-[color:var(--ink-soft)] transition-colors hover:bg-paper/70 hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)] sm:px-4"
          >
            Teacher
          </Link>
          <Link
            to="/staff"
            className="rounded-full px-3 py-2 text-sm font-medium text-[color:var(--ink-soft)] transition-colors hover:bg-paper/70 hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)] sm:px-4"
          >
            Staff
          </Link>
          <ThemeToggle className="ml-1" />
        </div>
      </nav>
    </header>
  );
}
