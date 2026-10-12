import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Signed link for a tenant's logo (tenant-logos is private). Null when none. */
export function useTenantLogo(logoUrl: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!logoUrl) { setSrc(null); return; }
    const m = "/tenant-logos/";
    const path = logoUrl.includes(m) ? decodeURIComponent(logoUrl.split(m)[1].split("?")[0]) : logoUrl.split("?")[0];
    let live = true;
    supabase.storage.from("tenant-logos").createSignedUrl(path, 3600).then(({ data }) => { if (live) setSrc(data?.signedUrl ?? null); });
    return () => { live = false; };
  }, [logoUrl]);
  return src;
}
