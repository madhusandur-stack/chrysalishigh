/**
 * Shared portal UI primitives. Every element uses the design tokens
 * (--paper / --line / --signal / --ink) so light and dark mode both work
 * without any hardcoded colours.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Inbox, Loader2, Paperclip, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-[20px] border border-line bg-paper", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-[color:var(--ink-soft)]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "signal",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "signal" | "ember" | "muted" | "danger";
}) {
  const toneClass =
    tone === "ember"
      ? "bg-[color:var(--ember-soft,var(--signal-soft))] text-[color:var(--ember)]"
      : tone === "danger"
        ? "bg-destructive/10 text-destructive"
        : tone === "muted"
          ? "bg-paper-2 text-[color:var(--ink-soft)]"
          : "bg-[color:var(--signal-soft)] text-[color:var(--signal)]";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[18px] border border-line bg-paper p-4 transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">{label}</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="mt-1 truncate text-xs text-[color:var(--ink-soft)]">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[10px]", toneClass)}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-dashed border-line bg-paper-2/40 px-6 py-12 text-center">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[color:var(--signal-soft)]">
        <Icon className="h-5 w-5 text-[color:var(--signal)]" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-xs text-[color:var(--ink-soft)]">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 4, height = 48 }: { rows?: number; height?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-[12px] bg-paper-2" style={{ height }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[16px] border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
      <p className="text-sm font-medium text-destructive">Couldn’t load this section</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[color:var(--ink-soft)]">
        {message ?? "Something went wrong talking to the server."}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4">
          <GhostButton as="span">Try again</GhostButton>
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-[color:var(--ink-soft)]">{label ?? "Progress"}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-paper-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full rounded-full bg-[color:var(--signal)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  present: "bg-[color:var(--signal-soft)] text-[color:var(--signal)]",
  submitted: "bg-[color:var(--signal-soft)] text-[color:var(--signal)]",
  approved: "bg-[color:var(--signal-soft)] text-[color:var(--signal)]",
  final: "bg-[color:var(--signal-soft)] text-[color:var(--signal)]",
  published: "bg-[color:var(--signal-soft)] text-[color:var(--signal)]",
  late: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  half_day: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  early_departure: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  draft: "bg-paper-2 text-[color:var(--ink-soft)]",
  scheduled: "bg-paper-2 text-[color:var(--ink-soft)]",
  leave: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  info_requested: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  absent: "bg-destructive/10 text-destructive",
  declined: "bg-destructive/10 text-destructive",
};

export function StatusPill({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
        STATUS_TONES[status] ?? "bg-paper-2 text-[color:var(--ink-soft)]",
      )}
    >
      {children ?? status.replace(/_/g, " ")}
    </span>
  );
}

/* ------------------------------ form controls ------------------------------ */

const controlClass =
  "w-full rounded-[12px] border border-line bg-paper-2 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-[color:var(--ink-soft)] focus-visible:border-[color:var(--signal)] focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]/25";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-[color:var(--ink-soft)]">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-[color:var(--ink-soft)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-28 resize-y leading-relaxed", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, "appearance-none pr-8", props.className)} />;
}

export function PrimaryButton({
  children,
  loading,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] bg-[color:var(--signal)] px-4 py-2.5 text-sm font-semibold text-[color:var(--signal-ink,white)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]/40 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  as,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "span" }) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-[12px] border border-line bg-paper px-3.5 py-2 text-sm font-medium text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]/30 disabled:opacity-60",
    className,
  );
  if (as === "span") return <span className={cls}>{children}</span>;
  return (
    <button {...rest} className={cls}>
      {children}
    </button>
  );
}

/* ------------------------------- attachments ------------------------------- */

export function AttachmentList({
  items,
  onRemove,
}: {
  items: { name: string; url: string }[];
  onRemove?: (index: number) => void;
}) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((a, i) => (
        <li
          key={`${a.url}-${i}`}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs"
        >
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-[color:var(--signal)]" />
          <a
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="truncate underline-offset-2 hover:underline"
            title={a.name}
          >
            {a.name}
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`Remove ${a.name}`}
              className="text-[color:var(--ink-soft)] hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-line">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 bg-paper-2 px-4 py-3 text-left mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-soft)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("border-t border-line px-4 py-3 align-middle", className)}>
      {children}
    </td>
  );
}

