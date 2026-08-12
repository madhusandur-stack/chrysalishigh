import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Folder, FolderOpen, Download } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { documents } from "@/lib/mock-data";
import { format } from "date-fns";
import { SmoothSearchInput } from "@/components/ui/smooth-input";

export const Route = createFileRoute("/_portal/documents")({ component: DocumentsPage });

const cats = Object.keys(documents) as (keyof typeof documents)[];

function DocumentsPage() {
  const [open, setOpen] = useState<string | null>(cats[0]);
  const [q, setQ] = useState("");

  const files = open ? documents[open as keyof typeof documents].filter((f) => f.name.toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <Page>
      <PageHeader title="Documents" subtitle="Circulars, receipts, permission letters and more." />

      <div className="mb-6">
        <SmoothSearchInput value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="Search files…" wrapperClassName="min-h-11 rounded-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {cats.map((c) => {
            const active = open === c;
            const Icon = active ? FolderOpen : Folder;
            return (
              <motion.button
                key={c}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(active ? null : c)}
                className={`flex w-full items-center gap-3 rounded-[14px] border p-4 text-left transition ${
                  active ? "border-[color:var(--signal)] bg-[color:var(--signal-soft)]" : "border-line bg-paper card-hover"
                }`}
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] ${active ? "bg-[color:var(--signal)] text-white" : "bg-paper-2 text-[color:var(--signal)]"}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c}</div>
                  <div className="mono text-[11px] text-[color:var(--ink-soft)]">{documents[c].length} files</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="card-surface min-h-[300px] p-5">
          <AnimatePresence mode="wait">
            <motion.div key={open ?? "empty"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {!open && <div className="grid h-[240px] place-items-center text-sm text-[color:var(--ink-soft)]">Select a category to view files.</div>}
              {open && (
                <>
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">{open}</div>
                  <div className="grid gap-2">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center gap-4 rounded-[12px] border border-line bg-paper-2 px-4 py-3">
                        <FileText className="h-4 w-4 text-[color:var(--signal)]" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{f.name}</div>
                          <div className="mono text-[11px] text-[color:var(--ink-soft)]">{format(new Date(f.date), "d MMM yyyy")}</div>
                        </div>
                        <button className="inline-flex h-8 items-center justify-center rounded-[10px] border border-line px-3 text-xs text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {files.length === 0 && <div className="text-sm text-[color:var(--ink-soft)]">No files match your search.</div>}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Page>
  );
}
