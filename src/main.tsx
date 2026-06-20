const APP_SHELL_WORKERS = new Set(["/sw.js", "/service-worker.js"]);
const PUSH_WORKER = "/sw-push.js";

function getRegistrationScript(reg: ServiceWorkerRegistration) {
  return reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
}

async function cleanStaleServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const expectedScope = window.location.origin + "/";
  const regs = await navigator.serviceWorker.getRegistrations();

  await Promise.allSettled(
    regs.map(async (reg) => {
      const scriptURL = getRegistrationScript(reg);
      if (!scriptURL) {
        await reg.update().catch(() => reg.unregister());
        return;
      }

      const url = new URL(scriptURL);
      const isSameOrigin = url.origin === window.location.origin;
      const isPushWorker = isSameOrigin && url.pathname === PUSH_WORKER;
      const isAppShellWorker = isSameOrigin && APP_SHELL_WORKERS.has(url.pathname);
      const ownsRootScope = reg.scope === expectedScope;

      if (isAppShellWorker || (ownsRootScope && !isPushWorker)) {
        await reg.unregister();
        return;
      }

      await reg.update().catch(async () => {
        if (!isPushWorker) await reg.unregister();
      });
    }),
  );
}

function boot() {
  void import("./bootstrap");
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  Promise.race([
    cleanStaleServiceWorkers(),
    new Promise((resolve) => window.setTimeout(resolve, 1500)),
  ])
    .catch((err) => console.warn("[SW] cleanup failed", err))
    .finally(boot);
} else {
  boot();
}
