import { X, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSetupChecklist } from "@/hooks/useSetupChecklist";

interface Props {
  id: string;
  title: string;
  body: string;
  cta: string;
  route: string;
  /** Only show if this checklist task is NOT done */
  showWhenTaskIncomplete?: string;
}

export function ProgressiveHint({ id, title, body, cta, route, showWhenTaskIncomplete }: Props) {
  const { dismissed, dismissHint, tasks } = useSetupChecklist();
  const navigate = useNavigate();

  if (dismissed.includes(id)) return null;
  if (showWhenTaskIncomplete) {
    const t = tasks.find((x) => x.id === showWhenTaskIncomplete);
    if (!t || t.done) return null;
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <Lightbulb className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
        <Button size="sm" variant="link" className="h-auto p-0 mt-2 text-xs gap-1" onClick={() => navigate(route)}>
          {cta} <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1 shrink-0" aria-label="Dismiss hint" onClick={() => dismissHint(id)}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}