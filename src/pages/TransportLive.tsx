import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default Leaflet icon assets aren't bundled — use a CDN icon.
const busIcon = L.divIcon({
  html: `<div style="background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:16px;">🚌</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

type Ping = {
  id: string;
  vehicle_id: string | null;
  trip_id: string | null;
  lat: number;
  lng: number;
  speed_kph: number | null;
  recorded_at: string;
};

export default function TransportLive() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [pings, setPings] = useState<Record<string, Ping>>({});
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let mounted = true;
    (async () => {
      const [{ data: vs }, { data: locs }] = await Promise.all([
        supabase.from("vehicles").select("id,registration_number,nickname").eq("tenant_id", tenantId),
        supabase
          .from("vehicle_locations")
          .select("id,vehicle_id,trip_id,lat,lng,speed_kph,recorded_at")
          .eq("tenant_id", tenantId)
          .gte("recorded_at", new Date(Date.now() - 30 * 60_000).toISOString())
          .order("recorded_at", { ascending: false })
          .limit(500),
      ]);
      if (!mounted) return;
      const vmap: Record<string, any> = {};
      (vs || []).forEach((v) => { vmap[v.id] = v; });
      setVehicles(vmap);
      const latest: Record<string, Ping> = {};
      (locs || []).forEach((p: any) => {
        const key = p.vehicle_id || p.trip_id || p.id;
        if (!latest[key]) latest[key] = { ...p, lat: Number(p.lat), lng: Number(p.lng) };
      });
      setPings(latest);
      setLoading(false);
    })();

    const ch = supabase
      .channel(`vehicle_locations_${tenantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vehicle_locations", filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          const p = payload.new as any;
          const key = p.vehicle_id || p.trip_id || p.id;
          setPings((prev) => ({ ...prev, [key]: { ...p, lat: Number(p.lat), lng: Number(p.lng) } }));
        }
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [tenantId]);

  const markers = useMemo(() => Object.values(pings), [pings]);
  const center = useMemo<[number, number]>(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return [-1.286389, 36.817223]; // Nairobi default
  }, [markers]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Live transport map</h1>
            <p className="text-sm text-muted-foreground">Real-time vehicle positions from active driver devices.</p>
          </div>
        </div>
        <Badge variant="secondary">{markers.length} vehicle{markers.length === 1 ? "" : "s"} live</Badge>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden rounded-md">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="h-[600px]">
              <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((m) => {
                  const v = m.vehicle_id ? vehicles[m.vehicle_id] : null;
                  const label = v ? (v.nickname || v.registration_number) : "Vehicle";
                  return (
                    <Marker key={m.id} position={[m.lat, m.lng]} icon={busIcon}>
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold">{label}</div>
                          {m.speed_kph != null && <div>Speed: {m.speed_kph} km/h</div>}
                          <div className="text-muted-foreground">{new Date(m.recorded_at).toLocaleTimeString()}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}