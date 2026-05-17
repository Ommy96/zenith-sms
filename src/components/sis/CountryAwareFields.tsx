import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GovIdField } from "@/lib/sis/countryFields";

interface Props {
  fields: GovIdField[];
  values: Record<string, any>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function CountryAwareFields({ fields, values, onChange, disabled }: Props) {
  if (fields.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-xs">
            {f.label}
            {f.hint && <span className="text-muted-foreground ml-1 font-normal">({f.hint})</span>}
          </Label>
          <Input
            value={values[f.key] ?? ""}
            placeholder={f.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(f.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}