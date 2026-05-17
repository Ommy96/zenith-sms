import { Bell, Search, Plus, ChevronDown, LogOut, User, Settings, Command as CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const { tenant } = useTenant();
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();

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
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-4 px-4 sticky top-0 z-30">
      <SidebarTrigger className="h-8 w-8" />

      {tenant && (
        <div className="hidden md:flex items-center gap-2 pr-3 border-r border-border h-8">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt="" className="h-6 w-6 rounded" />
          ) : (
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
              {tenant.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{tenant.name}</span>
        </div>
      )}

      <div className="flex-1 max-w-md">
        <button
          onClick={() => setOpen(true)}
          className="w-full h-9 rounded-md bg-secondary text-muted-foreground text-sm flex items-center gap-2 px-3 hover:bg-secondary/80 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search or jump to...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border">
            <CommandIcon className="h-3 w-3" />K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick Action</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Create New</DropdownMenuLabel>
            <DropdownMenuItem className="text-sm">Add Student</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Create Invoice</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Record Payment</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Post Announcement</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm">Mark Attendance</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Schedule Exam</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

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
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
