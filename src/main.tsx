import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSentry } from "./lib/observability/sentry";
import { initPostHog } from "./lib/observability/posthog";

initSentry();
initPostHog();

// Force a fresh check on any already-installed service workers (e.g. /sw-push.js
// for web push) so a stale worker can never strand a returning visitor on a
// cached shell. We do NOT register any new worker here — registration is opt-in
// from usePushSubscribe(). See the `pwa` skill for rationale.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((reg) => {
        reg.update().catch(() => {});
      });
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
