import { useState, useMemo, useEffect, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SmoothSearchInput } from "@/components/ui/smooth-input";

export type CampusOption = { id: string; name: string; slug: string };

export function CampusSelector({
  campuses,
  value,
  onChange,
  placeholder = "Select your campus",
}: {
  campuses: CampusOption[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = campuses.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campuses;
    return campuses.filter((c) => c.name.toLowerCase().includes(q));
  }, [campuses, query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[14px] border border-line bg-paper px-4 py-3 text-left text-sm transition",
          "focus:outline-none focus:ring-2 focus:ring-[color:var(--signal)]",
          !selected && "text-[color:var(--ink-soft)]",
        )}
      >
        <span className="truncate">{selected?.name ?? placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-[14px] border border-line bg-paper shadow-2xl"
          >
            <div className="border-b border-line p-2">
              <SmoothSearchInput
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery("")}
                placeholder="Search campuses…"
                wrapperClassName="min-h-10 rounded-[12px] border-0 bg-paper-2 px-3 py-2 shadow-none focus-within:shadow-none"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-[color:var(--ink-soft)]">No campuses match.</li>
              )}
              {filtered.map((c) => {
                const active = c.id === value;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-paper-2",
                        active && "text-[color:var(--signal)]",
                      )}
                    >
                      <span className="truncate">{c.name}</span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
