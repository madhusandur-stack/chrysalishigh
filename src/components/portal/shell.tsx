import { useState, type ReactNode } from "react";
import { PortalSidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { MobileDock } from "./mobile-dock";
import { studentNav, dockNav, type NavItem } from "./nav-config";

export function PortalShell({
  children,
  nav = studentNav,
  dock = dockNav,
  label,
}: {
  children: ReactNode;
  nav?: NavItem[];
  dock?: NavItem[];
  label?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-dvh w-full bg-canvas text-foreground">
      <PortalSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} items={nav} label={label} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 pb-28 lg:pb-10">{children}</main>
      </div>
      <MobileDock items={dock} />
    </div>
  );
}
