import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  CalendarDays, UserPlus, Briefcase, DollarSign, Receipt, Smartphone,
  FileText, Megaphone, Mail, MessageCircle, Bus, Library, Package,
  BarChart3, Settings, UserCog, GraduationCap, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface NavCmd { label: string; url: string; icon: any; group: string; keywords?: string }

interface SearchResults {
  students: Array<{ id: string; first_name: string; last_name: string; admission_number: string | null }>;
  staff: Array<{ id: string; first_name: string; last_name: string; staff_number: string | null; email: string | null }>;
  invoices: Array<{ id: string; invoice_number: string; balance: number; total: number; status: string; first_name: string; last_name: string }>;
  classes: Array<{ id: string; name: string; grade_level: string | null }>;
}

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
  const { profile } = useAuth();
  const { t } = useTranslation();
  const tenantId = profile?.tenant_id;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

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

  useEffect(() => {
    if (!open) { setQuery(""); setResults(null); return; }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!tenantId || q.length < 2) { setResults(null); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc("global_search", { _tenant: tenantId, _q: q, _limit: 5 });
      if (!cancelled) {
        if (!error && data) setResults(data as unknown as SearchResults);
        else setResults(null);
        setSearching(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, tenantId]);

  const go = (url: string) => { onOpenChange(false); navigate(url); };

  const groups = Array.from(new Set(commands.map(c => c.group)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t("search.placeholder", "Search students, staff, invoices, classes…")}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? (
            <span className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("search.searching", "Searching…")}
            </span>
          ) : t("search.none", "No results found.")}
        </CommandEmpty>

        {results && results.students.length > 0 && (
          <CommandGroup heading={t("search.students", "Students")}>
            {results.students.map((s) => (
              <CommandItem key={`stu-${s.id}`} value={`student ${s.first_name} ${s.last_name} ${s.admission_number ?? ""}`}
                onSelect={() => go(`/students/${s.id}`)}>
                <Users className="mr-2 h-4 w-4" />
                <span>{s.first_name} {s.last_name}</span>
                {s.admission_number && <span className="ml-auto text-xs text-muted-foreground">{s.admission_number}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results && results.staff.length > 0 && (
          <CommandGroup heading={t("search.staff", "Staff")}>
            {results.staff.map((s) => (
              <CommandItem key={`st-${s.id}`} value={`staff ${s.first_name} ${s.last_name} ${s.staff_number ?? ""}`}
                onSelect={() => go(`/staff/${s.id}`)}>
                <Briefcase className="mr-2 h-4 w-4" />
                <span>{s.first_name} {s.last_name}</span>
                {s.staff_number && <span className="ml-auto text-xs text-muted-foreground">{s.staff_number}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results && results.invoices.length > 0 && (
          <CommandGroup heading={t("search.invoices", "Invoices")}>
            {results.invoices.map((i) => (
              <CommandItem key={`inv-${i.id}`} value={`invoice ${i.invoice_number} ${i.first_name} ${i.last_name}`}
                onSelect={() => go(`/invoices?id=${i.id}`)}>
                <Receipt className="mr-2 h-4 w-4" />
                <span>{i.invoice_number}</span>
                <span className="ml-2 text-xs text-muted-foreground">{i.first_name} {i.last_name}</span>
                <span className="ml-auto text-xs">{i.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results && results.classes.length > 0 && (
          <CommandGroup heading={t("search.classes", "Classes")}>
            {results.classes.map((c) => (
              <CommandItem key={`cl-${c.id}`} value={`class ${c.name} ${c.grade_level ?? ""}`}
                onSelect={() => go(`/academics?class=${c.id}`)}>
                <GraduationCap className="mr-2 h-4 w-4" />
                <span>{c.name}</span>
                {c.grade_level && <span className="ml-auto text-xs text-muted-foreground">{c.grade_level}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results && (results.students.length || results.staff.length || results.invoices.length || results.classes.length) > 0 && <CommandSeparator />}

        {groups.map((g, i) => (
          <div key={g}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={i === 0 ? t("search.pages", "Pages") + " · " + g : g}>
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