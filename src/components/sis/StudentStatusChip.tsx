import { Badge } from "@/components/ui/badge";
import { studentStatusMeta } from "@/lib/sis/people";

export function StudentStatusChip({ status }: { status?: string | null }) {
  const m = studentStatusMeta(status);
  return <Badge variant="outline" className={`text-[10px] ${m.className}`}>{m.label}</Badge>;
}

export function StudentAvatar({ first, last, url }: { first?: string; last?: string; url?: string | null }) {
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  if (url) return <img src={url} alt="" className="h-8 w-8 rounded-full object-cover" />;
  return <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">{initials || "?"}</div>;
}
