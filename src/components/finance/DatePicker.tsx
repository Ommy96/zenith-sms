import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** App calendar picker working on ISO "YYYY-MM-DD" strings, a drop-in for <Input type="date">. */
export function DatePicker({ value, onChange, placeholder = "Pick a date", className, max, "aria-label": ariaLabel }: {
  value: string; onChange: (iso: string) => void; placeholder?: string; className?: string; max?: string; "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={ariaLabel} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}>
          <CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} defaultMonth={date} initialFocus className="p-3 pointer-events-auto"
          disabled={max ? (d) => d > parseISO(max) : undefined}
          onSelect={(d) => { onChange(d ? format(d, "yyyy-MM-dd") : ""); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}
