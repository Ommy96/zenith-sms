import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OfflineIndicator() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm shadow-lg"
    >
      <WifiOff className="h-4 w-4" />
      <span>{t("common.offline", "You're offline — changes will sync when back online")}</span>
    </div>
  );
}