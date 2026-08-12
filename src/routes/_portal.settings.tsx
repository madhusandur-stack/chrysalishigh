import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/portal/page";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_portal/settings")({ component: SettingsPage });

function SettingsPage() {
  const { theme, toggle } = useTheme();
  return (
    <Page>
      <PageHeader title="Settings" subtitle="Appearance, notifications and account." />

      <div className="grid gap-4">
        <Section title="Appearance">
          <Row label="Theme" hint="Switch between light and dark mode.">
            <button onClick={toggle} className="rounded-[12px] border border-line bg-paper px-4 py-2 text-sm font-medium capitalize">
              {theme}
            </button>
          </Row>
        </Section>

        <Section title="Notifications">
          {[
            { label: "Homework due reminders", on: true },
            { label: "New notices", on: true },
            { label: "Attendance alerts", on: false },
            { label: "Fee reminders", on: true },
          ].map((n) => (
            <Row key={n.label} label={n.label}>
              <Toggle defaultOn={n.on} />
            </Row>
          ))}
        </Section>

        <Section title="Account & Security">
          <Row label="Password" hint="Change your account password.">
            <button className="rounded-[12px] border border-line bg-paper px-4 py-2 text-sm font-medium">Change</button>
          </Row>
          <Row label="Linked guardian accounts" hint="Manage parent/guardian logins.">
            <button className="rounded-[12px] border border-line bg-paper px-4 py-2 text-sm font-medium">Manage</button>
          </Row>
        </Section>

        <Section title="Language">
          <Row label="Display language">
            <select className="rounded-[12px] border border-line bg-paper px-3 py-2 text-sm">
              <option>English</option><option>हिन्दी</option><option>ಕನ್ನಡ</option>
            </select>
          </Row>
        </Section>
      </div>
    </Page>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-6">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">{title}</div>
      <div className="divide-y divide-[color:var(--line)]">{children}</div>
    </div>
  );
}
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-[color:var(--ink-soft)]">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const id = `t-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <label htmlFor={id} className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-paper-2 transition has-[:checked]:bg-[color:var(--signal)]">
      <input id={id} type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </label>
  );
}
