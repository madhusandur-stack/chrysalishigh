import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useHydrated } from "@/hooks/use-hydrated";

/** Light/dark toggle. Persists to localStorage via ThemeProvider. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const hydrated = useHydrated();
  const isDark = hydrated && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper/70 text-[color:var(--ink-soft)] backdrop-blur transition-colors duration-300 hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--canvas)] ${className}`}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
