import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS, kes, studentName } from "@/lib/finance/format";

export interface FinStudent {
  id: string; first_name: string; last_name: string; admission_number: string | null;
  class_id: string | null; class_name: string | null; grade_level_id: string | null;
}

/** Active students with their current class, for pickers. */
export function useFinanceStudents() {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: [tenant?.id, "finance-students"],
    enabled: !!tenant?.id,
    queryFn: async (): Promise<FinStudent[]> => {
      const [{ data: st, error }, { data: en }] = await Promise.all([
        supabase.from("students").select("id, first_name, last_name, admission_number")
          .eq("tenant_id", tenant!.id).eq("enrollment_status", "active").order("first_name"),
        supabase.from("student_enrollments").select("student_id, class_id, classes:class_id(name, grade_level_id)")
          .eq("tenant_id", tenant!.id).eq("status", "active"),
      ]);
      if (error) throw error;
      const map = new Map<string, any>();
      (en ?? []).forEach((e: any) => map.set(e.student_id, e));
      return (st ?? []).map((s: any) => {
        const e = map.get(s.id);
        return { ...s, class_id: e?.class_id ?? null, class_name: e?.classes?.name ?? null, grade_level_id: e?.classes?.grade_level_id ?? null };
      });
    },
  });
}

export function StudentPicker({ value, onChange, students }: { value: string; onChange: (id: string) => void; students: FinStudent[] }) {
  const [open, setOpen] = useState(false);
  const selected = students.find((s) => s.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {selected ? `${studentName(selected)} · ${selected.admission_number ?? ""}` : "Search student…"}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command>
          <CommandInput placeholder="Name or admission number" />
          <CommandList>
            <CommandEmpty>No active students found.</CommandEmpty>
            <CommandGroup>
              {students.map((s) => (
                <CommandItem key={s.id} value={`${studentName(s)} ${s.admission_number ?? ""}`}
                  onSelect={() => { onChange(s.id); setOpen(false); }}>
                  <Check className={cn("h-4 w-4 mr-2", s.id === value ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1">{studentName(s)}</span>
                  <span className="text-xs text-muted-foreground">{s.class_name ?? "No class"} · {s.admission_number}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function InvoiceStatusChip({ status }: { status: string }) {
  const m = INVOICE_STATUS[status] ?? INVOICE_STATUS.draft;
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", m.className)}>{m.label}</span>;
}

export function KpiRow({ items }: { items: { label: string; value: number; tone?: "danger" | "success" }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((k) => (
        <Card key={k.label}><CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
          <p className={cn("mt-1 text-xl font-semibold font-mono tabular-nums",
            k.tone === "danger" && k.value > 0 && "text-destructive", k.tone === "success" && "text-success")}>{kes(k.value)}</p>
        </CardContent></Card>
      ))}
    </div>
  );
}

export function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-muted-foreground">We couldn't load this right now.</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}><RefreshCw className="h-4 w-4 mr-1" />Try again</Button>
    </div>
  );
}

export function useLookups() {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: [tenant?.id, "finance-lookups"],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const t = tenant!.id;
      const [y, tm, g, c] = await Promise.all([
        supabase.from("academic_years").select("id, name, is_current").eq("tenant_id", t).order("start_date", { ascending: false }),
        supabase.from("terms").select("id, name, academic_year_id, is_current, start_date, term_number").eq("tenant_id", t).order("start_date"),
        supabase.from("grade_levels").select("id, name, sort_order").eq("tenant_id", t).order("sort_order"),
        supabase.from("classes").select("id, name, grade_level_id").eq("tenant_id", t).eq("is_active", true).order("name"),
      ]);
      const years = y.data ?? [], terms = tm.data ?? [];
      return {
        years, terms, grades: g.data ?? [], classes: c.data ?? [],
        currentYear: years.find((x: any) => x.is_current)?.id ?? years[0]?.id ?? "",
        currentTerm: terms.find((x: any) => x.is_current)?.id ?? "",
      };
    },
  });
}

export const useNameMap = <T extends { id: string; name: string }>(rows: T[] | undefined) =>
  useMemo(() => Object.fromEntries((rows ?? []).map((r) => [r.id, r.name])) as Record<string, string>, [rows]);
