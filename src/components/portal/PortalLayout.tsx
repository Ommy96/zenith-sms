import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Wallet, CalendarCheck, FileText, MessageSquare, User, ChevronDown, LogOut } from "lucide-react";
import { usePortal } from "@/contexts/PortalContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/NotificationsBell";

const TABS = [
  { to: "/portal", icon: Home, label: "Home", end: true },
  { to: "/portal/fees", icon: Wallet, label: "Fees" },
  { to: "/portal/attendance", icon: CalendarCheck, label: "Attendance" },
  { to: "/portal/report-cards", icon: FileText, label: "Reports" },
  { to: "/portal/messages", icon: MessageSquare, label: "Messages" },
  { to: "/portal/profile", icon: User, label: "Profile" },
];

const initialsOf = (s?: string | null) =>
  (s || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function PortalLayout({ children }: { children: ReactNode }) {
  const { activeChild, children: kids, setActiveChildId, school } = usePortal();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const doSignOut = async () => { await signOut(); navigate("/portal/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col text-base">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-3 h-16 flex items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary" title={school?.name}>
              {school?.logo_url && failedLogo !== school.logo_url ? (
                <img src={school.logo_url} alt={`${school.name} logo`} className="h-full w-full rounded-lg object-contain" onError={() => setFailedLogo(school.logo_url)} />
              ) : initialsOf(school?.name)}
            </div>
            <span className="hidden sm:block truncate font-semibold">{school?.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {kids.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex min-h-11 items-center gap-2 rounded-xl px-2 hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      {activeChild?.photo_url && <AvatarImage src={activeChild.photo_url} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initialsOf(activeChild?.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[7rem] truncate text-sm font-medium">{activeChild?.first_name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>My children</DropdownMenuLabel>
                  {kids.map((k) => (
                    <DropdownMenuItem key={k.id} className="min-h-11" onClick={() => setActiveChildId(k.id)}>
                      <span className="truncate">{k.full_name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : activeChild ? (
              <span className="max-w-[9rem] truncate px-2 text-sm font-medium">{activeChild.first_name}</span>
            ) : null}
            <NotificationsBell portal />
            <Button size="icon" variant="ghost" className="h-11 w-11" onClick={doSignOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-28">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-background border-t pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto grid grid-cols-6">
          {TABS.map((t) => {
            const active = t.end ? location.pathname === t.to : location.pathname.startsWith(t.to);
            return (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${active ? "text-primary" : "text-muted-foreground"}`}>
                <t.icon className="h-5 w-5" />
                {t.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
