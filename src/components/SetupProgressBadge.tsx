import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useSetupChecklist } from "@/hooks/useSetupChecklist";

export function SetupProgressBadge() {
  const { tasks, percent, done, total, loading } = useSetupChecklist();
  const navigate = useNavigate();

  if (loading || percent === 100) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3">
          <Rocket className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">Setup {percent}%</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Setup Checklist</h3>
            <span className="text-xs text-muted-foreground">{done}/{total}</span>
          </div>
          <Progress value={percent} className="h-1.5" />
        </div>
        <div className="max-h-72 overflow-auto">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(t.route)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
            >
              {t.done
                ? <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <Button size="sm" className="w-full" onClick={() => navigate("/onboarding")}>
            Open Setup Wizard
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}