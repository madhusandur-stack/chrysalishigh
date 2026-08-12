import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { User } from "lucide-react";

export const Route = createFileRoute("/staff-portal/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <PortalPageHeader eyebrow="Account" title="Profile" description="Your campus admin identity." />
      <div className="rounded-[20px] border border-line bg-paper p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--signal-soft)] text-[color:var(--signal)]">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">{profile?.full_name ?? "Admin"}</div>
            <div className="text-sm text-[color:var(--ink-soft)]">{user?.email}</div>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Row label="Campus" value={profile?.campuses?.name ?? "—"} />
          <Row label="Roles" value={roles.join(", ") || "—"} />
        </dl>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/staff" }); }}
          className="mt-8 rounded-[12px] border border-line px-4 py-2 text-sm hover:bg-paper-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-paper-2 p-3">
      <dt className="text-xs uppercase tracking-wider text-[color:var(--ink-soft)]">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
