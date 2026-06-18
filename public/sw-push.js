/**
 * Web Push service worker for Zenith.
 *
 * Scoped intentionally to push delivery only. This worker does NOT
 * cache app shell or HTML — see the `pwa` skill: app-shell SWs break
 * Lovable preview by serving stale chunks. A future offline phase can
 * layer Workbox on top using vite-plugin-pwa.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Zenith", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "Zenith";
  const body = data.body || "";
  const url = data.url || "/portal/notifications";
  const tag = data.tag || "zenith-push";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/portal";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) { client.focus(); client.navigate(url); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});