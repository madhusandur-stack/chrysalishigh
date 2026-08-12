import { Link, useRouterState } from "@tanstack/react-router";
import { dockNav, type NavItem } from "./nav-config";
import { cn } from "@/lib/utils";

export function MobileDock({ items = dockNav }: { items?: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-4 lg:hidden">
      <nav className="glass flex items-center gap-1 rounded-full px-2 py-2 shadow-[var(--shadow-glass)]">
        {items.map((item) => {
          const active = item.to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                active
                  ? "bg-[color:var(--signal)] text-white shadow-md"
                  : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
