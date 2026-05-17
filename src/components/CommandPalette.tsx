import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  CalendarDays, UserPlus, Briefcase, DollarSign, Receipt, Smartphone,
  FileText, Megaphone, Mail, MessageCircle, Bus, Library, Package,
  BarChart3, Settings, UserCog,
} from "lucide-react";

interface NavCmd { label: string; url: string; icon: any; group: string; keywords?: string }

const commands: NavCmd[] = [
  { label: "Dashboard", url: "/", icon: LayoutDashboard, group: "Overview" },
  { label: "Students", url: "/students", icon: Users, group: "People", keywords: "learners pupils" },
  { label: "Admissions", url: "/admissions", icon: UserPlus, group: "People" },
  { label: "Staff & HR", url: "/staff", icon: Briefcase, group: "People" },
  { label: "Classes & Subjects", url: "/academics", icon: BookOpen, group: "Academics" },
  { label: "Attendance", url: "/attendance", icon: UserCog, group: "Academics" },
  { label: "Examinations", url: "/examinations", icon: ClipboardList, group: "Academics", keywords: "grades marks results" },
  { label: "Timetable", url: "/timetable", icon: CalendarDays, group: "Academics" },
  { label: "Fee Management", url: "/fees", icon: DollarSign, group: "Finance" },
  { label: "Invoices", url: "/invoices", icon: Receipt, group: "Finance" },
  { label: "Mobile Money", url: "/finance/mobile-money", icon: Smartphone, group: "Finance", keywords: "mpesa airtel" },
  { label: "Finance Reports", url: "/finance-reports", icon: FileText, group: "Finance" },
  { label: "Announcements", url: "/announcements", icon: Megaphone, group: "Communication" },
  { label: "Messaging", url: "/messaging", icon: Mail, group: "Communication" },
  { label: "WhatsApp", url: "/communication/whatsapp", icon: MessageCircle, group: "Communication" },
  { label: "Transport", url: "/transport", icon: Bus, group: "Operations" },
  { label: "Library", url: "/library", icon: Library, group: "Operations" },
  { label: "Inventory", url: "/inventory", icon: Package, group: "Operations" },
  { label: "Reports", url: "/reports", icon: BarChart3, group: "Insights" },
  { label: "Settings", url: "/settings", icon: Settings, group: "System" },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const go = (url: string) => { onOpenChange(false); navigate(url); };

  const groups = Array.from(new Set(commands.map(c => c.group)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions, students..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((g, i) => (
          <div key={g}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={g}>
              {commands.filter(c => c.group === g).map((c) => (
                <CommandItem key={c.url} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => go(c.url)}>
                  <c.icon className="mr-2 h-4 w-4" />
                  <span>{c.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}