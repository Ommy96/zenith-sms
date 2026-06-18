/**
 * Combined PWA "Add to Home Screen" CTA and push notification opt-in,
 * rendered on the parent portal first-visit / dashboard.
 */
import { Bell, BellRing, Download, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useInstallPrompt } from "@/lib/pwa/useInstallPrompt";
import { usePushSubscribe } from "@/lib/push/usePushSubscribe";
import { toast } from "sonner";

export function InstallAndNotifyCard() {
  const { t } = useTranslation();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const { status, enable, disable } = usePushSubscribe();

  const hidden = installed && status === "subscribed";
  if (hidden) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BellRing className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t("push.title", "Stay in the loop")}</p>
            <p className="text-xs text-muted-foreground">{t("push.body")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canInstall && !installed && (
            <Button size="sm" onClick={async () => {
              const r = await promptInstall();
              if (r === "accepted") toast.success(t("pwa.installed", "Installed"));
            }}>
              <Download className="h-4 w-4 mr-1" /> {t("pwa.install")}
            </Button>
          )}
          {status === "default" && (
            <Button size="sm" variant="secondary" onClick={async () => {
              const ok = await enable();
              if (ok) toast.success(t("push.enabled"));
            }}>
              <Bell className="h-4 w-4 mr-1" /> {t("push.enable")}
            </Button>
          )}
          {status === "subscribed" && (
            <Button size="sm" variant="ghost" onClick={async () => { await disable(); toast.message(t("push.enable")); }}>
              <BellOff className="h-4 w-4 mr-1" /> {t("push.enabled")}
            </Button>
          )}
          {status === "blocked" && (
            <p className="text-xs text-destructive">{t("push.blocked")}</p>
          )}
          {status === "unsupported" && (
            <p className="text-xs text-muted-foreground">{t("push.notSupported")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}