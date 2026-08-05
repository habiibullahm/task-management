import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MobileDrawer } from "./MobileDrawer";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  titleForPath,
} from "@/config/nav";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { persistTheme, readStoredTheme, type ThemeMode } from "@/theme/tokens";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSE_KEY = "tm-sidebar-collapsed";

export function AppShell() {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const [mobileNavPath, setMobileNavPath] = useState<string | null>(null);
  // Clear while rendering when crossing to desktop (avoids setState-in-effect).
  if (isDesktop && mobileNavPath !== null) {
    setMobileNavPath(null);
  }
  const mobileOpen =
    mobileNavPath !== null &&
    mobileNavPath === location.pathname &&
    !isDesktop;
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme());

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const closeMobileNav = useCallback(() => {
    setMobileNavPath(null);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const sidebarWidth = collapsed
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="fixed inset-y-0 left-0 z-40 hidden md:block"
        style={{ width: sidebarWidth }}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      <MobileDrawer open={mobileOpen} onClose={closeMobileNav} />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
        )}
        style={{ paddingLeft: isDesktop ? sidebarWidth : 0 }}
      >
        <TopBar
          title={titleForPath(location.pathname)}
          onOpenMobileNav={() => setMobileNavPath(location.pathname)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
