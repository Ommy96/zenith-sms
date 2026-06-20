import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface InlineEditCardProps<T extends Record<string, any>> {
  title: ReactNode;
  icon?: ReactNode;
  /** id of the row to update (students.id) */
  rowId: string;
  /** table name */
  table: "students";
  /** initial values, will be re-passed by parent after refresh */
  values: T;
  /** which fields to render */
  fields: { key: keyof T & string; label: string; type?: "text" | "number" | "date" | "textarea" | "select"; options?: { value: string; label: string }[]; placeholder?: string }[];
  /** which card is currently being edited, used to enforce single-edit-at-a-time */
  editingKey: string | null;
  setEditingKey: (k: string | null) => void;
  cardKey: string;
  canEdit: boolean;
  onSaved: (next: Partial<T>) => void;
  /** Optional read-only renderer for a field; falls back to string. */
  renderValue?: (key: string, value: any) => ReactNode;
}

export function InlineEditCard<T extends Record<string, any>>({
  title, icon, rowId, table, values, fields, editingKey, setEditingKey, cardKey, canEdit, onSaved, renderValue,
}: InlineEditCardProps<T>) {
  const isEditing = editingKey === cardKey;
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Partial<T>>({});

  const start = () => { setDraft({ ...values }); setEditingKey(cardKey); };
  const cancel = () => { setDraft({}); setEditingKey(null); };
  const save = async () => {
    setBusy(true);
    const patch: Record<string, any> = {};
    for (const f of fields) {
      const v = draft[f.key];
      patch[f.key] = v === "" ? null : v;
    }
    const { error } = await supabase.from(table).update(patch).eq("id", rowId);
    setBusy(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    onSaved(patch as Partial<T>);
    setEditingKey(null);
    toast({ title: "Saved" });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">{icon}{title}</h3>
        {canEdit && !isEditing && editingKey == null && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={start} aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancel} disabled={busy}><X className="h-3.5 w-3.5" /></Button>
            <Button size="sm" className="h-7 px-3" onClick={save} disabled={busy}>{busy && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Save</Button>
          </div>
        )}
      </div>
      <div className="space-y-2.5">
        {fields.map((f) => {
          const val = isEditing ? (draft[f.key] ?? "") : values[f.key];
          if (!isEditing) {
            const display = renderValue ? renderValue(f.key, val) : (val ?? <span className="text-muted-foreground/60">—</span>);
            return (
              <div key={f.key} className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground shrink-0">{f.label}</span>
                <span className="text-right truncate font-medium">{display as any}</span>
              </div>
            );
          }
          const setV = (v: any) => setDraft({ ...draft, [f.key]: v } as Partial<T>);
          return (
            <div key={f.key} className="grid grid-cols-3 items-center gap-3">
              <label className="text-xs text-muted-foreground col-span-1">{f.label}</label>
              <div className="col-span-2">
                {f.type === "textarea" ? (
                  <textarea className="w-full text-sm rounded-md border bg-background px-2.5 py-1.5" rows={2} value={val as any} onChange={(e) => setV(e.target.value)} placeholder={f.placeholder} />
                ) : f.type === "select" ? (
                  <select className="w-full text-sm rounded-md border bg-background px-2 py-1.5" value={(val as any) ?? ""} onChange={(e) => setV(e.target.value)}>
                    <option value="">—</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={f.type ?? "text"} className="w-full text-sm rounded-md border bg-background px-2.5 py-1.5" value={(val as any) ?? ""} onChange={(e) => setV(e.target.value)} placeholder={f.placeholder} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}