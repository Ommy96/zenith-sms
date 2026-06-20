import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, Play, Square, Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Driver PWA-style page: select an active trip and stream GPS pings
 * to `vehicle_locations` every 10s while tracking is on.
 */
export default function Driver() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [trips, setTrips] = useState<any[]>([]);
  const [tripId, setTripId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [lastFix, setLastFix] = useState<{ lat: number; lng: number; at: Date } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const watchIdRef = useRef<number | null>(null);
  const lastSendRef = useRef<number>(0);

  const loadTrips = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("transport_trips")
      .select("id, direction, status, trip_date, vehicle_id, driver_id, route_id, transport_routes(name)")
      .eq("tenant_id", tenantId)
      .gte("trip_date", today)
      .order("trip_date", { ascending: true })
      .limit(20);
    setTrips(data || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const sendPing = useCallback(async (pos: GeolocationPosition) => {
    if (!tenantId || !tripId) return;
    const trip = trips.find((t) => t.id === tripId);
    const { error } = await supabase.from("vehicle_locations").insert({
      tenant_id: tenantId,
      trip_id: tripId,
      vehicle_id: trip?.vehicle_id || null,
      driver_id: trip?.driver_id || null,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      speed_kph: pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6 * 100) / 100 : null,
      heading: pos.coords.heading ?? null,
      accuracy_m: pos.coords.accuracy ?? null,
      recorded_at: new Date(pos.timestamp).toISOString(),
    });
    if (!error) {
      setPingCount((n) => n + 1);
      setLastFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, at: new Date() });
    }
  }, [tenantId, tripId, trips]);

  const start = () => {
    if (!tripId) return toast({ title: "Pick a trip first", variant: "destructive" });
    if (!("geolocation" in navigator)) return toast({ title: "Geolocation not supported", variant: "destructive" });
    setTracking(true);
    setPingCount(0);
    lastSendRef.current = 0;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSendRef.current < 10_000) return; // throttle to ~10s
        lastSendRef.current = now;
        void sendPing(pos);
      },
      (err) => {
        toast({ title: "Location error", description: err.message, variant: "destructive" });
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    toast({ title: "Tracking started", description: "Pings every ~10 seconds." });
  };

  const stop = () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setTracking(false);
  };

  useEffect(() => () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Driver</h1>
        </div>
        <Badge variant={online ? "secondary" : "destructive"} className="gap-1">
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />} {online ? "online" : "offline"}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Today's trips</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> :
            trips.length === 0 ? <div className="text-sm text-muted-foreground">No trips scheduled for today.</div> :
              <div className="space-y-2">
                {trips.map((t) => (
                  <button key={t.id} disabled={tracking}
                    onClick={() => setTripId(t.id)}
                    className={`w-full text-left rounded border p-3 text-sm ${tripId === t.id ? "border-primary bg-primary/5" : "border-border"}`}>
                    <div className="font-medium">{t.transport_routes?.name || "Route"} • {t.direction}</div>
                    <div className="text-xs text-muted-foreground">{t.trip_date} • {t.status}</div>
                  </button>
                ))}
              </div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Live tracking</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!tracking ? (
            <Button className="w-full" onClick={start} disabled={!tripId}>
              <Play className="h-4 w-4 mr-2" />Start trip
            </Button>
          ) : (
            <Button variant="destructive" className="w-full" onClick={stop}>
              <Square className="h-4 w-4 mr-2" />Stop tracking
            </Button>
          )}
          {tracking && (
            <div className="text-xs space-y-1">
              <div>Pings sent: <span className="font-mono">{pingCount}</span></div>
              {lastFix && (
                <>
                  <div>Last fix: {lastFix.lat.toFixed(5)}, {lastFix.lng.toFixed(5)}</div>
                  <div className="text-muted-foreground">at {lastFix.at.toLocaleTimeString()}</div>
                </>
              )}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Keep this page open while driving. The app sends your location every ~10 seconds.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}