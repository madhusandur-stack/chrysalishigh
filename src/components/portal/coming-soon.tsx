import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-[20px] border border-dashed border-line bg-paper p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--signal-soft)]">
          <Icon className="h-6 w-6 text-[color:var(--signal)]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[color:var(--ink-soft)]">
          {description ?? "This module is part of Stage 2. The data model is in place — the full UI ships next."}
        </p>
        <span className="mono mt-4 inline-block rounded-full border border-line bg-paper-2 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
          Coming soon
        </span>
      </div>
    </div>
  );
}

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--signal)]">{eyebrow}</span>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-[color:var(--ink-soft)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
