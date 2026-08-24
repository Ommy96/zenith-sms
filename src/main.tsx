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

const RELOAD_FLAG = "zenith:boot-retry";

async function hardReset() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}

function boot() {
  import("./bootstrap").catch(async (err) => {
    console.error("[boot] failed to load app bundle", err);
    // Retry once with a cache-busting query before giving up.
    try {
      await import(/* @vite-ignore */ `./bootstrap?retry=${Date.now()}`);
      return;
    } catch {
      /* fall through */
    }
    await hardReset();
    if (!sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }
  });
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
