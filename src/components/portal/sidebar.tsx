import { memo, useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ChrysalisLogo } from "./logo";
import { studentNav, type NavItem } from "./nav-config";
import { usePerfMode } from "@/hooks/use-perf-mode";
import { cn } from "@/lib/utils";

function computeActiveTo(pathname: string, items: NavItem[]): string | null {
  let best: NavItem | null = null;
  for (const item of items) {
    if (pathname === item.to) return item.to;
    if (item.to === "/dashboard") continue;
    if (pathname.startsWith(item.to) && (!best || item.to.length > best.to.length)) {
      best = item;
    }
  }
  return best?.to ?? null;
}

function SidebarItem({
  item,
  active,
  collapsed,
  animate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  animate: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to}
        className={cn(
          "group relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[14px] font-medium transition-colors",
          active
            ? "text-[color:var(--signal)]"
            : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
        )}
      >
        {active &&
          (animate ? (
            <motion.span
              layoutId="active-nav-pill"
              className="absolute inset-0 -z-0 rounded-[14px] bg-gradient-to-r from-[color:var(--signal-soft)] to-transparent"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          ) : (
            <span className="absolute inset-0 -z-0 rounded-[14px] bg-[color:var(--signal-soft)]" />
          ))}
        <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

const MemoSidebarItem = memo(SidebarItem);

function PortalSidebarImpl({
  collapsed,
  onToggle,
  items = studentNav,
  label,
}: {
  collapsed: boolean;
  onToggle: () => void;
  items?: NavItem[];
  label?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { disableAnimations } = usePerfMode();
  const activeTo = useMemo(() => computeActiveTo(pathname, items), [pathname, items]);

  return (
    <motion.aside
      animate={disableAnimations ? undefined : { width: collapsed ? 76 : 240 }}
      style={disableAnimations ? { width: collapsed ? 76 : 240 } : undefined}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-paper lg:flex"
    >
      <div className={cn("flex flex-col gap-1 px-5 pt-6 pb-4", collapsed && "items-center px-2")}>
        <ChrysalisLogo className={collapsed ? "h-9" : "h-11"} />
        {label && !collapsed && (
          <span className="mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--signal)]">{label}</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <MemoSidebarItem
              key={item.to}
              item={item}
              active={item.to === activeTo}
              collapsed={collapsed}
              animate={!disableAnimations}
            />
          ))}
        </ul>
      </nav>

      <div className={cn("border-t border-line p-3", collapsed && "px-2")}>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-paper-2 px-3 py-2 text-xs font-medium text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}

export const PortalSidebar = memo(PortalSidebarImpl);


// Back-compat export for existing imports
export const StudentSidebar = PortalSidebar;
