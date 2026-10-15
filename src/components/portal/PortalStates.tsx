import { ReactNode } from "react";
import { LucideIcon, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/portal/format";

export function PortalEmpty({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <p className="text-base font-semibold">{title}</p>
      {text && <p className="mt-1 text-base text-muted-foreground">{text}</p>}
    </div>
  );
}

export function PortalError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border bg-card px-6 py-8 text-center">
      <p className="text-base">We couldn't load this right now.</p>
      <Button variant="outline" className="mt-3 min-h-11" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" /> Try again
      </Button>
    </div>
  );
}

export function StaleNote({ at, onRetry }: { at: number | null; onRetry: () => void }) {
  if (!at) return null;
  return (
    <button onClick={onRetry} className="flex min-h-11 w-full items-center gap-2 rounded-lg bg-muted px-3 text-left text-sm text-muted-foreground">
      <WifiOff className="h-4 w-4 shrink-0" /> Offline — showing data last updated {timeAgo(at)}. Tap to retry.
    </button>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-2">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
      {sub && <p className="text-base text-muted-foreground">{sub}</p>}
    </div>
  );
}
