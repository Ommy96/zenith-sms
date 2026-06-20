import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  /** Kept for API compatibility; tile always renders in accent-soft per design system. */
  color?: "primary" | "success" | "warning" | "info" | "destructive";
}

/**
 * Stat tile — per design system §6.7.
 *  - Label: 11px uppercase 600 muted, tracking-[0.04em]
 *  - Value: 28px bold tabular-nums, tracking-[-0.02em]
 *  - Trend badge: success/danger soft pill
 *  - Icon tile: 36px square, accent-soft bg, 18px accent icon, radius-md
 *  - No competing surface color on the card itself — accent is rare.
 */
export function StatCard({ title, value, change, changeType = "neutral", icon: Icon }: StatCardProps) {
  const trendClass =
    changeType === "positive"
      ? "bg-[hsl(var(--success-soft))] text-[hsl(var(--success-foreground))]"
      : changeType === "negative"
        ? "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger-foreground))]"
        : "bg-surface-elevated text-tertiary-fg";

  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-strong">
      <div className="flex items-start justify-between gap-3">
        <p className="label-section">{title}</p>
        <div className="h-9 w-9 shrink-0 rounded-md bg-accent-soft flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-accent" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground" style={{ letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {change && (
        <div className="mt-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${trendClass}`}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
