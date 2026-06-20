import { useRef } from "react";
import {
  Search, Plus, ChevronDown, LogOut, Settings,
  Command as CommandIcon, UserPlus, Wallet, ClipboardCheck,
  Megaphone, Receipt, FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { useNavigate } from "react-router-dom";
import { NotificationsBell } from "./NotificationsBell";
import { SetupProgressBadge } from "./SetupProgressBadge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const { tenant } = useTenant();
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const logoClicks = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null });

  // Escape hatch: 5 quick clicks on the tenant logo unregisters every service
  // worker and clears caches, then hard-reloads. Real recovery tool for users
  // stuck on a stale shell.
  const handleLogoClick = async () => {
    logoClicks.current.count += 1;
    if (logoClicks.current.timer) window.clearTimeout(logoClicks.current.timer);
    logoClicks.current.timer = window.setTimeout(() => {
      logoClicks.current.count = 0;
    }, 2000);
    if (logoClicks.current.count >= 5) {
      logoClicks.current.count = 0;
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.allSettled(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.allSettled(keys.map((k) => caches.delete(k)));
        }
      } catch (err) {
        console.warn("[Recovery] cleanup failed", err);
      }
      window.location.reload();
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
    <CommandPalette open={open} onOpenChange={setOpen} />
    <header className="h-14 border-b border-border bg-background flex items-center gap-4 px-4 sticky top-0 z-30">
      <SidebarTrigger className="h-8 w-8" />

      {tenant && (
        <button
          type="button"
          onClick={handleLogoClick}
          title="Tap 5× to force-refresh"
          className="hidden md:flex items-center gap-2 pr-3 border-r border-border h-8 hover:opacity-80 transition-opacity"
        >
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt="" className="h-6 w-6 rounded" />
          ) : (
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
              {tenant.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">{tenant.name}</span>
        </button>
      )}

      <div className="flex-1 max-w-xl hidden md:block">
        <button
          onClick={() => setOpen(true)}
          className="w-full h-10 rounded-md border border-border bg-background text-left text-sm flex items-center gap-2.5 px-3 hover:border-strong focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground truncate">Search students, fees, classes…</span>
          <kbd className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            <CommandIcon className="h-3 w-3" />K
          </kbd>
        </button>
      </div>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted ml-auto"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1.5 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 rounded-md px-3 font-semibold">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Quick action</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Create</DropdownMenuLabel>
            <DropdownMenuItem className="text-sm gap-2" onClick={() => navigate("/students/import")}>
              <UserPlus className="h-4 w-4 text-muted-foreground" /> Add student
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2" onClick={() => navigate("/fees")}>
              <Wallet className="h-4 w-4 text-muted-foreground" /> Record payment
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2" onClick={() => navigate("/attendance")}>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" /> Mark attendance
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2" onClick={() => navigate("/announcements")}>
              <Megaphone className="h-4 w-4 text-muted-foreground" /> Send announcement
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2" onClick={() => navigate("/invoices")}>
              <Receipt className="h-4 w-4 text-muted-foreground" /> Create invoice
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2" onClick={() => navigate("/reports")}>
              <FileBarChart className="h-4 w-4 text-muted-foreground" /> Generate report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <LanguageSwitcher />
        <SetupProgressBadge />
        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 rounded-lg px-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {initials}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile?.full_name || "User"}</span>
                <span className="text-xs text-muted-foreground">{profile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" /> {t("common.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
