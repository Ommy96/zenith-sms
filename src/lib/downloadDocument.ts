import { supabase } from "@/integrations/supabase/client";

export type DocumentKind = "receipt" | "invoice" | "statement" | "report_card";

/**
 * Downloads a PDF as bytes through the download-document function and saves it
 * from a local blob, so the browser never opens a Storage signed link (which
 * ad blockers often block). Throws an Error with a readable message on failure.
 */
export async function downloadDocument(kind: DocumentKind, id: string, fallbackFilename = "document.pdf"): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in again to download this document.");
  const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/download-document`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ kind, id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "Download failed. Please try again.");
  }
  const blob = await res.blob();
  const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+?)"/)?.[1] || fallbackFilename;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
