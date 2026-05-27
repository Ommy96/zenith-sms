import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "ss_cookie_consent_v1";

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);

  const record = async (granted: boolean) => {
    localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied");
    const visitor_id = localStorage.getItem("ss_visitor_id") || crypto.randomUUID();
    localStorage.setItem("ss_visitor_id", visitor_id);
    await supabase.from("consent_records").insert({
      visitor_id, consent_type: "cookies", granted,
      user_agent: navigator.userAgent, policy_version: "1.0",
    });
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 rounded-lg border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">We value your privacy</p>
          <p className="text-xs text-muted-foreground mb-3">
            We use essential cookies for authentication. With your consent, we may also use analytics cookies to improve the platform.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => record(true)}>Accept all</Button>
            <Button size="sm" variant="outline" onClick={() => record(false)}>Essential only</Button>
          </div>
        </div>
      </div>
    </div>
  );
}