import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/portal/page";
import { CountUp } from "@/components/portal/count-up";
import { fees } from "@/lib/mock-data";
import { format } from "date-fns";

export const Route = createFileRoute("/_portal/fees")({ component: FeesPage });

function FeesPage() {
  const pct = Math.round((fees.paid / fees.total) * 100);
  return (
    <Page>
      <PageHeader title="Fee Details" subtitle="Summary, receipts and history." />

      <div className="card-surface mb-6 overflow-hidden p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <Stat label="Total" value={fees.total} />
          <Stat label="Paid" value={fees.paid} accent="emerald" />
          <Stat label="Outstanding" value={fees.outstanding} accent="ember" />
        </div>
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-paper-2">
          <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--emerald)] to-[color:var(--signal)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mono mt-2 flex items-center justify-between text-[11px] text-[color:var(--ink-soft)]">
          <span>{pct}% paid</span>
          <button className="rounded-full bg-[color:var(--signal)] px-5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-10px_rgba(47,95,227,0.6)]">Pay Now</button>
        </div>
      </div>

      <div className="card-surface p-6">
        <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Payment history</div>
        <div className="grid gap-2">
          {fees.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-4 rounded-[14px] border border-line bg-paper-2 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{h.label}</div>
                <div className="mono text-[11px] text-[color:var(--ink-soft)]">{format(new Date(h.date), "d MMM yyyy")}</div>
              </div>
              <div className="mono text-sm font-semibold">₹{h.amount.toLocaleString("en-IN")}</div>
              <span className={`mono rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                h.status === "Paid"
                  ? "bg-[color-mix(in_srgb,var(--emerald)_15%,transparent)] text-[color:var(--emerald)]"
                  : "bg-[color-mix(in_srgb,var(--ember)_15%,transparent)] text-[color:var(--ember)]"
              }`}>{h.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "emerald" | "ember" }) {
  const color = accent === "emerald" ? "text-[color:var(--emerald)]" : accent === "ember" ? "text-[color:var(--ember)]" : "";
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{label}</div>
      <div className={`mono mt-1 text-[28px] font-semibold leading-none ${color}`}>₹<CountUp to={value} /></div>
    </div>
  );
}
