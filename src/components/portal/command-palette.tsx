import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMac } from "@/lib/theme";
import { studentNav } from "./nav-config";
import { notices, homework, reportCards } from "@/lib/mock-data";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[10vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-[20px] border border-line bg-paper shadow-[0_30px_80px_-20px_rgba(19,26,44,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Search" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[color:var(--ink-soft)]">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                <Search className="h-4 w-4 text-[color:var(--ink-soft)]" />
                <Command.Input
                  autoFocus
                  placeholder="Search homework, notices, report cards…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--ink-soft)]"
                />
              </div>
              <Command.List className="max-h-[420px] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-8 text-center text-sm text-[color:var(--ink-soft)]">
                  No results found.
                </Command.Empty>
                <Command.Group heading="Pages">
                  {studentNav.map((item) => (
                    <Command.Item
                      key={item.to}
                      value={`page ${item.label}`}
                      onSelect={() => go(item.to)}
                      className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-sm data-[selected=true]:bg-paper-2"
                    >
                      <item.icon className="h-4 w-4 text-[color:var(--ink-soft)]" />
                      <span>{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Notices">
                  {notices.map((n) => (
                    <Command.Item
                      key={n.id}
                      value={`notice ${n.title}`}
                      onSelect={() => go("/noticeboard")}
                      className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-sm data-[selected=true]:bg-paper-2"
                    >
                      <span className="truncate">{n.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Homework">
                  {homework.map((h) => (
                    <Command.Item
                      key={h.id}
                      value={`hw ${h.subject} ${h.title}`}
                      onSelect={() => go("/homework")}
                      className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-sm data-[selected=true]:bg-paper-2"
                    >
                      <span className="text-[color:var(--ink-soft)]">{h.subject}</span>
                      <span className="truncate">{h.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Report Cards">
                  {reportCards.map((r) => (
                    <Command.Item
                      key={r.id}
                      value={`report ${r.term} ${r.year}`}
                      onSelect={() => go("/report-cards")}
                      className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-sm data-[selected=true]:bg-paper-2"
                    >
                      <span>{r.term} · {r.year}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  const isMac = useIsMac();
  return (
    <button
      onClick={onClick}
      className="glass flex h-10 min-w-0 flex-1 max-w-md items-center gap-3 rounded-full px-4 text-sm text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="truncate">Search homework, notices, teachers…</span>
      <kbd className="mono ml-auto hidden shrink-0 items-center rounded-md border border-line bg-paper-2 px-2 py-0.5 text-[11px] sm:inline-flex">
        {isMac ? "⌘K" : "Ctrl+K"}
      </kbd>
    </button>
  );
}
