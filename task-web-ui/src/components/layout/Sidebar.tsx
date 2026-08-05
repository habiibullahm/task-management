import { NavLink, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { APP_NAV, isNavActive } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  className,
}: Readonly<SidebarProps>) {
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border px-3",
          collapsed ? "justify-center" : "justify-between gap-2",
        )}
      >
        {!collapsed ? (
          <span className="truncate text-sm font-semibold tracking-tight">
            Task Management
          </span>
        ) : (
          <span className="text-sm font-bold">TM</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 shrink-0 md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2" aria-label="Main">
        {APP_NAV.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={!item.matchPrefix}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", active && "text-primary")}
              />
              {!collapsed ? (
                <span className="truncate">{item.label}</span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
