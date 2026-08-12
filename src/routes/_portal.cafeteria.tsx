import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { cafeteria } from "@/lib/mock-data";
import { format } from "date-fns";

export const Route = createFileRoute("/_portal/cafeteria")({ component: CafeteriaPage });

function CafeteriaPage() {
  return (
    <Page>
      <PageHeader title="Cafeteria Menu" subtitle="The full monthly menu published by school." />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-surface card-hover mb-6 flex items-center gap-5 p-6">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[16px] bg-[color-mix(in_srgb,var(--emerald)_15%,transparent)] text-[color:var(--emerald)]">
          <FileText className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">Current menu</div>
          <div className="mt-1 text-xl font-semibold">{cafeteria.month}</div>
          <div className="mono mt-1 text-xs text-[color:var(--ink-soft)]">Uploaded {format(new Date(cafeteria.uploaded), "d MMM yyyy")} · {cafeteria.file}</div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-[12px] border border-line bg-paper px-4 py-2.5 text-xs font-medium">View PDF</button>
          <button className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2.5 text-xs font-semibold text-white">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </motion.div>

      <div className="card-surface p-6">
        <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Previous months</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cafeteria.history.map((m) => (
            <div key={m.month} className="flex items-center gap-3 rounded-[14px] border border-line bg-paper-2 p-4">
              <FileText className="h-4 w-4 text-[color:var(--emerald)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{m.month}</div>
                <div className="mono text-[11px] text-[color:var(--ink-soft)]">{m.file}</div>
              </div>
              <Download className="h-4 w-4 text-[color:var(--ink-soft)]" />
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
