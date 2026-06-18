/**
 * Captures the `beforeinstallprompt` event so the parent portal can
 * show its own "Install app" CTA instead of waiting for the browser's
 * mini-infobar. iOS Safari does not fire this event; we surface a
 * polite hint there instead.
 */
import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstalled(Boolean(isStandalone));
    const onBefore = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!evt) return "unavailable" as const;
    await evt.prompt();
    const choice = await evt.userChoice;
    setEvt(null);
    return choice.outcome;
  }, [evt]);

  return { canInstall: !!evt && !installed, installed, promptInstall };
}