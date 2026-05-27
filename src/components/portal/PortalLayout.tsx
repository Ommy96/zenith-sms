import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, GraduationCap, Wallet, MessageSquare, User, ChevronDown, LogOut, Megaphone, Sparkles } from "lucide-react";
import { usePortal } from "@/contexts/PortalContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/NotificationsBell";

const tabs = [
  { to: "/portal", icon: Home, label: "Home", end: true },
  { to: "/portal/academics", icon: GraduationCap, label: "Academics" },
  { to: "/portal/study-buddy", icon: Sparkles, label: "Study" },
  { to: "/portal/fees", icon: Wallet, label: "Fees" },
  { to: "/portal/messages", icon: MessageSquare, label: "Messages" },
];

export function PortalLayout({ children }: { children: ReactNode }) {
  const { activeChild, children: kids, setActiveChildId } = usePortal();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = activeChild
    ? `${activeChild.first_name?.[0] || ""}${activeChild.last_name?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-muted transition">
                <Avatar className="h-9 w-9">
                  {activeChild?.photo_url && <AvatarImage src={activeChild.photo_url} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-semibold leading-tight">{activeChild?.full_name || "Select child"}</div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    {activeChild?.admission_number || "—"}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Your children</DropdownMenuLabel>
              {kids.map((k) => (
                <DropdownMenuItem key={k.id} onClick={() => setActiveChildId(k.id)}>
                  <Avatar className="h-7 w-7 mr-2">
                    {k.photo_url && <AvatarImage src={k.photo_url} />}
                    <AvatarFallback className="text-xs">{(k.first_name?.[0] || "") + (k.last_name?.[0] || "")}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{k.full_name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await signOut(); navigate("/portal/login", { replace: true }); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => navigate("/portal/announcements")} title="Announcements">
              <Megaphone className="h-5 w-5" />
            </Button>
            <NotificationsBell portal />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 pb-24">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-background border-t">
        <div className="max-w-md mx-auto grid grid-cols-5">
          {tabs.map((t) => {
            const active = t.end ? location.pathname === t.to : location.pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <t.icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition`} />
                {t.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}