import { Bell, LogOut, MapPin, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme";
import { CommandPalette, SearchTrigger } from "./command-palette";
import { useAuth } from "@/hooks/use-auth";

export function TopBar() {
  const { theme, toggle } = useTheme();
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: navigator.platform.includes("Mac"),
      ctrlKey: !navigator.platform.includes("Mac"),
      bubbles: true,
    });
    window.dispatchEvent(event);
    setPaletteOpen(true);
  };

  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "Guest";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const campusName = profile?.campuses?.name;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--canvas)_85%,transparent)] px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <SearchTrigger onClick={openPalette} />

        {campusName && (
          <div className="hidden items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink-soft)] md:flex">
            <MapPin className="h-3.5 w-3.5 text-[color:var(--signal)]" />
            <span className="truncate max-w-[220px]">{campusName}</span>
          </div>
        )}

        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[color:var(--ember)]" />
        </button>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-paper text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -60, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 60, opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </motion.div>
          </AnimatePresence>
        </button>

        <div className="hidden items-center gap-3 rounded-full border border-line bg-paper py-1.5 pl-1.5 pr-2 sm:flex">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[color:var(--signal)] to-[color:var(--violet)] text-xs font-semibold text-white">
            {initials || "?"}
          </div>
          <div className="text-right leading-tight">
            <div className="text-[13px] font-semibold">{displayName}</div>
            {profile?.grade && (
              <div className="mono text-[11px] text-[color:var(--ink-soft)]">{profile.grade}</div>
            )}
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
            aria-label="Sign out"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-paper-2 hover:text-[color:var(--ink)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <CommandPalette key={paletteOpen ? "1" : "0"} />
    </>
  );
}
