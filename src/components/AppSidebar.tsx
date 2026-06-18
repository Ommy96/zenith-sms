import {
  LayoutDashboard, Users, CreditCard, ClipboardList,
  BookOpen, UserCog, Bus, Library, BarChart3, Settings,
  ChevronRight, Briefcase, CalendarDays, UserPlus,
  Megaphone, Mail, DollarSign, Receipt, Package, Smartphone, MessageCircle,
  Bot,
  Database, ShieldCheck, GraduationCap as GradCap,
  Lock,
  ClipboardCheck, Crown, Activity as ActivityIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";

interface NavItem { title: string; url: string; icon: any; perm?: string; superAdminOnly?: boolean; tKey?: string; }
interface NavSection { label: string; items: NavItem[]; superAdminOnly?: boolean; tKey?: string; }

const sections: NavSection[] = [
  { label: "Academics", tKey: "nav.section.academics", items: [
    { title: "Students", tKey: "nav.students", url: "/students", icon: Users, perm: "students.view" },
    { title: "Classes & Subjects", tKey: "nav.classesSubjects", url: "/academics", icon: BookOpen, perm: "academics.view" },
    { title: "Timetable", tKey: "nav.timetable", url: "/timetable", icon: CalendarDays, perm: "academics.view" },
    { title: "Examinations", tKey: "nav.examinations", url: "/examinations", icon: ClipboardList, perm: "exams.view" },
    { title: "Attendance", tKey: "nav.attendance", url: "/attendance", icon: UserCog, perm: "attendance.view" },
  ]},
  { label: "Finance", tKey: "nav.section.finance", items: [
    { title: "Fees & Invoices", tKey: "nav.feesInvoices", url: "/fees", icon: Receipt, perm: "fees.view" },
    { title: "Payments", tKey: "nav.payments", url: "/finance/mobile-money", icon: Smartphone, perm: "fees.configure" },
    { title: "Payroll", tKey: "nav.payroll", url: "/finance?tab=payroll", icon: DollarSign, perm: "payroll.manage" },
  ]},
  { label: "Communication", tKey: "nav.section.communication", items: [
    { title: "Announcements", tKey: "nav.announcements", url: "/announcements", icon: Megaphone, perm: "communication.send" },
    { title: "Messages", tKey: "nav.messages", url: "/messaging", icon: Mail, perm: "communication.send" },
    { title: "WhatsApp", tKey: "nav.whatsapp", url: "/communication/whatsapp", icon: MessageCircle, perm: "communication.send" },
  ]},
  { label: "Operations", tKey: "nav.section.operations", items: [
    { title: "Admissions", tKey: "nav.admissions", url: "/admissions", icon: UserPlus, perm: "admissions.view" },
    { title: "Staff & HR", tKey: "nav.staffHr", url: "/staff", icon: Briefcase, perm: "staff.view" },
    { title: "Transport", tKey: "nav.transport", url: "/transport", icon: Bus, perm: "transport.view" },
    { title: "Library", tKey: "nav.library", url: "/library", icon: Library, perm: "library.view" },
    { title: "Inventory", tKey: "nav.inventory", url: "/inventory", icon: Package, perm: "inventory.view" },
  ]},
  { label: "Compliance", items: [
    { title: "NEMIS (KE)", url: "/integrations/nemis", icon: Database, perm: "settings.manage" },
    { title: "TSC (KE)", url: "/integrations/tsc", icon: GradCap, perm: "settings.manage" },
    { title: "Statutory Filings", url: "/compliance/statutory", icon: ShieldCheck, perm: "payroll.manage" },
    { title: "Audit Reports", url: "/compliance/audit-reports", icon: ClipboardCheck, perm: "reports.view" },
    { title: "Data Protection", url: "/dpa", icon: Lock, perm: "settings.manage" },
  ]},
  { label: "Super Admin", superAdminOnly: true, items: [
    { title: "All Tenants", url: "/admin/tenants", icon: Crown, superAdminOnly: true },
    { title: "Audit Log", url: "/admin/audit", icon: ActivityIcon, superAdminOnly: true },
  ]},
];

// Top-pinned items, always visible above section list
const pinnedTop: NavItem[] = [
  { title: "Dashboard", tKey: "nav.dashboard", url: "/", icon: LayoutDashboard },
  { title: "Copilot", url: "/copilot", icon: Bot },
];

// Bottom-pinned items (below divider)
const pinnedBottom: NavItem[] = [
  { title: "Reports", tKey: "nav.reports", url: "/reports", icon: BarChart3, perm: "reports.view" },
  { title: "Billing", url: "/billing", icon: CreditCard, perm: "settings.manage" },
  { title: "Settings", tKey: "nav.settings", url: "/settings", icon: Settings, perm: "settings.manage" },
];

function filterSections(can: (perm: string) => boolean, showAll: boolean, isSuper: boolean): NavSection[] {
  return sections
    .filter(s => !s.superAdminOnly || isSuper)
    .map(s => ({ ...s, items: s.items.filter(i => (!i.superAdminOnly || isSuper) && (!i.perm || showAll || can(i.perm))) }))
    .filter(s => s.items.length > 0);
}

const STORAGE_KEY = "zenith.sidebar.groups";

function getStoredOpen(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function PinnedItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
        <NavLink
          to={item.url}
          end={item.url === "/"}
          className={cn(
            "group/navlink relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
            collapsed && "justify-center px-2",
          )}
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-primary"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarSection({ section, collapsed }: { section: NavSection; collapsed: boolean }) {
  const location = useLocation();
  const isActive = section.items.some((item) =>
    item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url.split("?")[0])
  );
  const stored = getStoredOpen();
  const [open, setOpen] = useState<boolean>(isActive || stored[section.label] === true);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  const persist = (next: boolean) => {
    setOpen(next);
    const s = getStoredOpen();
    s[section.label] = next;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  };

  if (collapsed) {
    return (
      <SidebarMenu>
        {section.items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <NavLink to={item.url} end={item.url === "/"}
                className="flex items-center justify-center rounded-md px-2 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={persist}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors">
        <span>{section.label}</span>
        <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="pl-3">
          {section.items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end={item.url === "/"}
                  className="group/navlink relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-primary"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  <span className="truncate">{item.title}</span>
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
      <SidebarHeader className="px-3 py-3 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">S</div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground tracking-tight truncate">Zenith</span>
              <span className="text-[11px] text-muted-foreground truncate">School OS</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 gap-1 overflow-y-auto pt-2">
        {/* Pinned top */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {pinnedTop.map((it) => (
                <PinnedItem key={it.url} item={it} collapsed={collapsed} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <div className="mx-3 my-1 h-px bg-sidebar-border" />}

        {filterSections(can, showAll, role === "super_admin").map((section) => (
          <SidebarGroup key={section.label} className="py-0">
            <SidebarGroupContent>
              <SidebarSection section={section} collapsed={collapsed} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {!collapsed && <div className="mx-3 my-2 h-px bg-sidebar-border" />}

        {/* Pinned bottom */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {pinnedBottom
                .filter((it) => !it.perm || showAll || can(it.perm))
                .map((it) => (
                  <PinnedItem key={it.url} item={it} collapsed={collapsed} />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <button className={cn(
          "group flex items-center gap-3 w-full rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0 text-left">
              <span className="text-sm font-medium text-foreground truncate leading-tight">{profile?.full_name || "User"}</span>
              <span className="text-[11px] text-muted-foreground truncate">{roleName}</span>
            </div>
          )}
          {!collapsed && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
