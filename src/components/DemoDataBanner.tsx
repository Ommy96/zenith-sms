import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const DISMISS_KEY = "demo_banner_dismissed_until";

export function DemoDataBanner() {
  const { isDemo, profile } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!isDemo || !profile?.tenant_id) { setDismissed(true); return; }
    const until = Number(localStorage.getItem(`${DISMISS_KEY}:${profile.tenant_id}`) || 0);
    setDismissed(Date.now() < until);
  }, [isDemo, profile?.tenant_id]);

  if (!isDemo || dismissed) return null;

  const dismiss = () => {
    if (!profile?.tenant_id) return;
    localStorage.setItem(`${DISMISS_KEY}:${profile.tenant_id}`, String(Date.now() + 24 * 60 * 60 * 1000));
    setDismissed(true);
  };

  return (
    <div className="border-b border-warning/30 bg-warning/10">
      <div className="px-6 py-2.5 flex items-center gap-3 flex-wrap">
        <Sparkles className="h-4 w-4 text-warning shrink-0" />
        <p className="text-sm text-foreground flex-1 min-w-0">
          You're viewing <span className="font-medium">sample data</span>. Replace it with your school's real data anytime.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={() => navigate("/setup?import=true")}>
            Replace with my school's data
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={dismiss}>
            Keep exploring
          </Button>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}