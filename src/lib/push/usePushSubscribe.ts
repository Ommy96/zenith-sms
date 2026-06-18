/**
 * Web Push enrollment helper. Keeps the browser permission flow, service
 * worker registration, and Supabase upsert in one place.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type PushStatus = "unsupported" | "blocked" | "default" | "subscribed" | "loading";

const SW_PATH = "/sw-push.js";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function usePushSubscribe() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<PushStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") { setStatus("blocked"); return; }
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub && Notification.permission === "granted") setStatus("subscribed");
      else if (Notification.permission === "granted") setStatus("default");
      else setStatus("default");
    } catch {
      setStatus("default");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const enable = useCallback(async () => {
    setError(null);
    if (!user) { setError("Sign in first"); return false; }
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported"); return false;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { setStatus(perm === "denied" ? "blocked" : "default"); return false; }

    // Fetch VAPID public key from edge function
    const { data: vapidData, error: vapidErr } = await supabase.functions.invoke("push-vapid-key");
    if (vapidErr || !vapidData?.publicKey) {
      setError("Push not configured by school yet");
      return false;
    }
    const reg = await navigator.serviceWorker.register(SW_PATH);
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
    });
    const json = sub.toJSON();
    const { error: upsertErr } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      tenant_id: profile?.tenant_id ?? null,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
      user_agent: navigator.userAgent.slice(0, 200),
    }, { onConflict: "user_id,endpoint" });
    if (upsertErr) { setError(upsertErr.message); return false; }
    setStatus("subscribed");
    return true;
  }, [user, profile?.tenant_id]);

  const disable = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("default");
  }, []);

  return { status, error, enable, disable, refresh };
}