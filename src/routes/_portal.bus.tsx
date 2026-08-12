import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/portal/page";
import { BusWidget } from "@/components/portal/bus-widget";
import { transport } from "@/lib/mock-data";

export const Route = createFileRoute("/_portal/bus")({ component: BusPage });

function BusPage() {
  return (
    <Page>
      <PageHeader title="Bus Tracking" subtitle="Your assigned bus route and live tracking." />
      <div className="grid gap-4 md:grid-cols-2">
        <BusWidget />
        <div className="card-surface p-6">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Attendant</div>
          <div className="grid gap-3 text-sm">
            <Row label="Bus attendant" value={transport.attendant} />
            <Row label="Contact" value={transport.attendantContact} mono />
            <Row label="Driver" value={transport.driver} />
            <Row label="Pickup location" value={transport.pickup.location} />
            <Row label="Drop location" value={transport.drop.location} />
          </div>
        </div>
      </div>
    </Page>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-none">
      <span className="text-xs uppercase tracking-wider text-[color:var(--ink-soft)]">{label}</span>
      <span className={`text-sm font-medium ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}
