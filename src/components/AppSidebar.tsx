import {
  LayoutDashboard, Users, GraduationCap, CreditCard, ClipboardList,
  BookOpen, MessageSquare, UserCog, Bus, Library, BarChart3, Settings,
  ChevronRight, Briefcase, FileText, CalendarDays, UserPlus,
  Megaphone, Mail, DollarSign, Receipt, Package,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem { title: string; url: string; icon: any; }
interface NavSection { label: string; items: NavItem[]; }

const sections: NavSection[] = [
  { label: "Overview", items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }] },
  { label: "Academics", items: [
    { title: "Classes & Subjects", url: "/academics", icon: BookOpen },
    { title: "Examinations", url: "/examinations", icon: ClipboardList },
    { title: "Timetable", url: "/timetable", icon: CalendarDays },
  ]},
  { label: "People", items: [
    { title: "Students", url: "/students", icon: Users },
    { title: "Admissions", url: "/admissions", icon: UserPlus },
    { title: "Staff & HR", url: "/staff", icon: Briefcase },
  ]},
  { label: "Finance", items: [
    { title: "Fee Management", url: "/fees", icon: DollarSign },
    { title: "Invoices", url: "/invoices", icon: Receipt },
    { title: "Reports", url: "/finance-reports", icon: FileText },
  ]},
  { label: "Communication", items: [
    { title: "Announcements", url: "/announcements", icon: Megaphone },
    { title: "Messaging", url: "/messaging", icon: Mail },
  ]},
  { label: "Operations", items: [
    { title: "Transport", url: "/transport", icon: Bus },
    { title: "Library", url: "/library", icon: Library },
    { title: "Inventory", url: "/inventory", icon: Package },
  ]},
  { label: "System", items: [
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];

function SidebarSection({ section, collapsed }: { section: NavSection; collapsed: boolean }) {
  const location = useLocation();
  const isActive = section.items.some((item) =>
    item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
  );
  const [open, setOpen] = useState(isActive);

  if (collapsed) {
    return (
      <SidebarMenu>
        {section.items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <NavLink to={item.url} end={item.url === "/"}
                className="flex items-center justify-center rounded-lg px-2 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <item.icon className="h-4 w-4 shrink-0" />
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  if (section.items.length === 1) {
    const item = section.items[0];
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <NavLink to={item.url} end={item.url === "/"}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            >
              <item.icon className="h-4 w-4 shrink-0" /><span>{item.title}</span>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors">
        {section.label}
        <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end={item.url === "/"}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" /><span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, role } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleName = role ? role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">S</div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground tracking-tight">SomaSphere</span>
              <span className="text-[11px] text-muted-foreground">School ERP</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 gap-1">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="py-0">
            <SidebarGroupContent>
              <SidebarSection section={section} collapsed={collapsed} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground truncate">{profile?.full_name || "User"}</span>
              <span className="text-[11px] text-muted-foreground truncate">{roleName}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
