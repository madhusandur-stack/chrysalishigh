import { Bus, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { transport } from "@/lib/mock-data";

export function BusWidget({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card-surface card-hover relative overflow-hidden p-5">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[color:var(--signal-soft)] blur-2xl" aria-hidden />
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--signal)] text-white">
            <Bus className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">My Bus</div>
            <div className="mono text-lg font-semibold leading-none">{transport.busNumber}</div>
          </div>
        </div>

        {!compact && (
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <Row label="Route" value={transport.route} mono />
            <Row label="Driver" value={transport.driver} />
            <Row label="Pickup" value={transport.pickup.time} mono />
            <Row label="Drop" value={transport.drop.time} mono />
          </div>
        )}
        {compact && (
          <div className="mb-4 flex items-center gap-6 text-sm">
            <Row label="Pickup" value={transport.pickup.time} mono />
            <Row label="Driver" value={transport.driver} />
          </div>
        )}

        <motion.a
          whileTap={{ scale: 0.98 }}
          href={transport.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[color:var(--signal)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(47,95,227,0.6)] transition hover:shadow-[0_14px_38px_-10px_rgba(47,95,227,0.7)]"
        >
          Track Live Bus
          <ExternalLink className="h-4 w-4" />
        </motion.a>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{label}</div>
      <div className={`mt-0.5 text-[13px] font-medium ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}
