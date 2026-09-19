import { Link, useRouterState } from "@tanstack/react-router";
import { FileText, Menu } from "lucide-react";
import { dockNav, studentNav, type NavItem } from "./nav-config";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const reportCardsItem: NavItem = { to: "/report-cards", label: "Report Cards", icon: FileText };

function isActivePath(pathname: string, item: NavItem) {
  return item.to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.to);
}

export function MobileDock({ items = dockNav }: { items?: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isStudentDock = items === dockNav;
  const visibleItems = isStudentDock ? items.slice(0, 4) : items;
  const fullStudentMenu = studentNav.flatMap((item) =>
    item.to === "/academics" ? [item, reportCardsItem] : [item],
  );

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-4 lg:hidden">
      <nav className="glass grid grid-flow-col items-center gap-1 rounded-full px-2 py-2 shadow-[var(--shadow-glass)]">
        {visibleItems.map((item) => {
          const active = isActivePath(pathname, item);
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
        {isStudentDock && (
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--ink)]"
              >
                <Menu className="h-[19px] w-[19px]" strokeWidth={1.75} />
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[82dvh] rounded-t-[20px] border-line bg-paper">
              <DrawerHeader className="border-b border-line px-5 pb-4 text-left">
                <DrawerTitle className="font-display text-base">Student menu</DrawerTitle>
              </DrawerHeader>
              <nav aria-label="Student portal navigation" className="overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                <div className="grid grid-cols-2 gap-2">
                  {fullStudentMenu.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item);
                    return (
                      <DrawerClose asChild key={`${item.to}-${item.label}`}>
                        <Link
                          to={item.to}
                          className={cn(
                            "flex min-w-0 items-center gap-3 rounded-[14px] border px-3 py-3 text-sm font-medium transition-colors",
                            active
                              ? "border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal)]"
                              : "border-line bg-paper-2 text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </Link>
                      </DrawerClose>
                    );
                  })}
                </div>
              </nav>
            </DrawerContent>
          </Drawer>
        )}
      </nav>
    </div>
  );
}
