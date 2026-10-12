import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";

const BUCKET = "tenant-logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const HEX = /^#[0-9a-f]{6}$/i;

/** Storage path from a stored logo_url (plain path or legacy full URL). */
const toPath = (v: string) => v.includes(`/${BUCKET}/`) ? decodeURIComponent(v.split(`/${BUCKET}/`)[1].split("?")[0]) : v.split("?")[0];

/** PDFs can only embed PNG/JPG, so SVG and WebP are converted to PNG in the browser. */
async function normalise(file: File): Promise<{ blob: Blob; ext: "png" | "jpg" }> {
  if (file.type === "image/png") return { blob: file, ext: "png" };
  if (file.type === "image/jpeg") return { blob: file, ext: "jpg" };
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    let w = img.naturalWidth || 512, h = img.naturalHeight || 512;
    const scale = Math.min(1, 1024 / Math.max(w, h)); w = Math.round(w * scale); h = Math.round(h * scale);
    if (file.type === "image/svg+xml" && Math.max(w, h) < 512) { const up = 512 / Math.max(w, h); w = Math.round(w * up); h = Math.round(h * up); }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
    if (!blob) throw new Error("convert");
    return { blob, ext: "png" };
  } finally { URL.revokeObjectURL(url); }
}

export function BrandingTab() {
  const { tenant, can, refresh } = useTenant();
  const { toast } = useToast();
  const editable = can("tenant.settings.edit");
  const fileRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [motto, setMotto] = useState("");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenant?.id) return;
    void (async () => {
      const { data } = await supabase.from("tenants").select("logo_url, motto, primary_color, secondary_color").eq("id", tenant.id).maybeSingle();
      setMotto(data?.motto ?? ""); setPrimary(data?.primary_color ?? ""); setSecondary(data?.secondary_color ?? "");
      if (data?.logo_url) {
        const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(toPath(data.logo_url), 3600);
        setCurrent(s?.signedUrl ?? null);
      } else setCurrent(null);
    })();
  }, [tenant?.id, tenant?.logo_url]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f?: File) => {
    setFileError(null);
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return setFileError("Use a PNG, JPG, SVG or WebP image.");
    if (f.size > MAX_BYTES) return setFileError("This image is larger than 2 MB. Please choose a smaller file.");
    setPending(f); setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!tenant?.id || !pending) return;
    setUploading(true);
    try {
      const { blob, ext } = await normalise(pending);
      if (blob.size > MAX_BYTES) throw new Error("After conversion the image is larger than 2 MB. Try a smaller image.");
      const path = `${tenant.id}/logo.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: ext === "png" ? "image/png" : "image/jpeg", cacheControl: "60" });
      if (error) throw error;
      const other = `${tenant.id}/logo.${ext === "png" ? "jpg" : "png"}`;
      await supabase.storage.from(BUCKET).remove([other]);
      const { error: uErr } = await supabase.from("tenants").update({ logo_url: path }).eq("id", tenant.id);
      if (uErr) throw uErr;
      setPending(null); setPreview(null);
      await refresh();
      toast({ title: "Logo uploaded", description: "It now appears on statements, invoices and receipts." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message?.includes("row-level") ? "You don't have permission to change the logo." : (e?.message ?? "Please try again."), variant: "destructive" });
    } finally { setUploading(false); }
  };

  const remove = async () => {
    if (!tenant?.id) return;
    const { error } = await supabase.from("tenants").update({ logo_url: null }).eq("id", tenant.id);
    if (error) return toast({ title: "Could not remove logo", description: error.message, variant: "destructive" });
    await supabase.storage.from(BUCKET).remove([`${tenant.id}/logo.png`, `${tenant.id}/logo.jpg`]);
    setCurrent(null); await refresh();
    toast({ title: "Logo removed" });
  };

  const save = async () => {
    if (!tenant?.id) return;
    for (const [label, v] of [["Primary colour", primary], ["Secondary colour", secondary]] as const)
      if (v && !HEX.test(v)) return toast({ title: `${label} must look like #D97706`, variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.from("tenants").update({ motto: motto.trim() || null, primary_color: primary || null, secondary_color: secondary || null }).eq("id", tenant.id);
    setSaving(false);
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    await refresh();
    toast({ title: "Branding saved" });
  };

  const shown = preview ?? current;

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <h3 className="text-sm font-semibold text-card-foreground">School Branding</h3>

      <div className="space-y-2">
        <Label className="text-sm">School logo</Label>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="h-28 w-40 rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
            {shown ? <img src={shown} alt="School logo" className="max-h-full max-w-full object-contain p-2" />
              : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
          </div>
          {editable ? (
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept={ACCEPT.join(",")} className="hidden"
                onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              <div className="flex flex-wrap gap-2">
                {pending ? (
                  <>
                    <Button size="sm" onClick={upload} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}Upload
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setPending(null); setPreview(null); }} disabled={uploading}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>{current ? "Replace" : "Choose logo"}</Button>
                    {current && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmRemove(true)}><Trash2 className="h-4 w-4 mr-1" />Remove</Button>}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP, up to 2 MB. Square or horizontal, at least 200×200px, transparent background preferred.</p>
              {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{current ? "Only school administrators can change the logo." : "No logo uploaded yet."}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([["Primary colour", primary, setPrimary], ["Secondary colour (optional)", secondary, setSecondary]] as const).map(([label, v, set]) => (
          <div key={label} className="space-y-2">
            <Label className="text-sm">{label}</Label>
            <div className="flex items-center gap-2">
              <input type="color" aria-label={label} disabled={!editable} value={HEX.test(v) ? v : "#d97706"}
                onChange={(e) => set(e.target.value)} className="h-9 w-9 rounded-lg border border-border bg-transparent cursor-pointer disabled:cursor-not-allowed" />
              <Input value={v} placeholder="#D97706" disabled={!editable} onChange={(e) => set(e.target.value.trim())} className="flex-1 font-mono" />
            </div>
          </div>
        ))}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">School motto</Label>
          <Input value={motto} maxLength={160} disabled={!editable} placeholder="e.g. Knowledge is Power" onChange={(e) => setMotto(e.target.value)} />
        </div>
      </div>

      {editable && (
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save changes</Button>
        </div>
      )}

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove logo?</AlertDialogTitle>
            <AlertDialogDescription>Remove the current school logo? Downloadable documents will show the school name initials instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
