import {
  LayoutDashboard, Users, GraduationCap, CreditCard, ClipboardList,
  BookOpen, MessageSquare, UserCog, Bus, Library, BarChart3, Settings,
  ChevronRight, Briefcase, FileText, CalendarDays, UserPlus,
  Megaphone, Mail, DollarSign, Receipt, Package, Smartphone, MessageCircle,
  ShieldAlert, HeartPulse, Calendar as CalendarIcon,
  BedDouble,
  Bot,
  TrendingDown,
  ScanLine,
  UserCheck,
  Camera,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem { title: string; url: string; icon: any; perm?: string; }
interface NavSection { label: string; items: NavItem[]; }

const sections: NavSection[] = [
  { label: "Overview", items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }] },
  { label: "Copilot", items: [
    { title: "Admin Copilot", url: "/copilot", icon: Bot },
  ]},
  { label: "Academics", items: [
    { title: "Classes & Subjects", url: "/academics", icon: BookOpen, perm: "academics.view" },
    { title: "Attendance", url: "/attendance", icon: UserCog, perm: "attendance.view" },
    { title: "Face Attendance (AI)", url: "/attendance/face", icon: Camera, perm: "attendance.view" },
    { title: "Examinations", url: "/examinations", icon: ClipboardList, perm: "exams.view" },
    { title: "OCR Grader (AI)", url: "/examinations/ocr", icon: ScanLine, perm: "exams.view" },
    { title: "Timetable", url: "/timetable", icon: CalendarDays, perm: "academics.view" },
  ]},
  { label: "People", items: [
    { title: "Students", url: "/students", icon: Users, perm: "students.view" },
    { title: "Admissions", url: "/admissions", icon: UserPlus, perm: "admissions.view" },
    { title: "Admission Screener (AI)", url: "/admissions/screener", icon: UserCheck, perm: "admissions.view" },
    { title: "Staff & HR", url: "/staff", icon: Briefcase, perm: "staff.view" },
  ]},
  { label: "Finance", items: [
    { title: "Fee Management", url: "/fees", icon: DollarSign, perm: "fees.view" },
    { title: "Invoices", url: "/invoices", icon: Receipt, perm: "fees.view" },
    { title: "Mobile Money", url: "/finance/mobile-money", icon: Smartphone, perm: "fees.configure" },
    { title: "Fee Risk (AI)", url: "/fees/risk", icon: TrendingDown, perm: "fees.view" },
    { title: "Reports", url: "/finance-reports", icon: FileText, perm: "fees.view" },
  ]},
  { label: "Communication", items: [
    { title: "Announcements", url: "/announcements", icon: Megaphone, perm: "communication.send" },
    { title: "Messaging", url: "/messaging", icon: Mail, perm: "communication.send" },
    { title: "WhatsApp", url: "/communication/whatsapp", icon: MessageCircle, perm: "communication.send" },
    { title: "AI Documents", url: "/documents", icon: FileText },
  ]},
  { label: "Operations", items: [
    { title: "Transport", url: "/transport", icon: Bus, perm: "transport.view" },
    { title: "Library", url: "/library", icon: Library, perm: "library.view" },
    { title: "Inventory", url: "/inventory", icon: Package, perm: "inventory.view" },
    { title: "Discipline", url: "/discipline", icon: ShieldAlert, perm: "discipline.view" },
    { title: "Health", url: "/health", icon: HeartPulse, perm: "health.view" },
    { title: "Events", url: "/events", icon: CalendarIcon, perm: "events.view" },
    { title: "Hostel", url: "/hostel", icon: BedDouble, perm: "hostel.view" },
  ]},
  { label: "Insights", items: [
    { title: "Reports", url: "/reports", icon: BarChart3, perm: "reports.view" },
  ]},
  { label: "System", items: [
    { title: "Settings", url: "/settings", icon: Settings, perm: "settings.manage" },
  ]},
];

function filterSections(can: (perm: string) => boolean, showAll: boolean): NavSection[] {
  return sections
    .map(s => ({ ...s, items: s.items.filter(i => !i.perm || showAll || can(i.perm)) }))
    .filter(s => s.items.length > 0);
}

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
  const { can, permissions, loading: tenantLoading } = useTenant();
  // Show every nav item when the user is a tenant admin OR when we haven't
  // loaded any permissions yet — permission gating still happens at the
  // page/RLS level. This prevents the sidebar from collapsing to just
  // "Dashboard" when role/perm rows are missing.
  const showAll =
    role === "super_admin" || role === "school_admin" ||
    (!tenantLoading && permissions.length === 0);

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

      <SidebarContent className="px-2 gap-1 overflow-y-auto">
        {filterSections(can, showAll).map((section) => (
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
