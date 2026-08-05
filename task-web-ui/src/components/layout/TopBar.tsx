import { useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import type { ThemeMode } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  onOpenMobileNav: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function TopBar({
  title,
  onOpenMobileNav,
  theme,
  onToggleTheme,
}: TopBarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-3 sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
        {title}
      </h1>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          onClick={onToggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <span
          className={cn(
            "hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline",
          )}
        >
          {user?.firstName} {user?.lastName}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Logout"
          onClick={handleLogout}
          className="gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
