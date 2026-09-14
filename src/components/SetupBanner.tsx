import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupProgress } from "@/hooks/useSetupProgress";

/** Persistent reminder shown until the school's setup is at least 40% complete. */
export function SetupBanner() {
  const { data, isLoading } = useSetupProgress();
  const percent = data?.completion_percentage ?? 0;
  if (isLoading || !data || percent >= 40) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Rocket className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Complete your school setup ({percent}% done)</p>
          <p className="text-xs text-muted-foreground">Add your academic year, terms and grade levels to unlock the rest of Zenith.</p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to="/setup">Continue setup</Link>
      </Button>
    </div>
  );
}

export default SetupBanner;
