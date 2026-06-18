import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Submit handler. Throw to surface as toast.error. Return falsy to cancel close. */
  onSubmit: () => Promise<void | boolean>;
  submitLabel?: string;
  /** Render the form body. */
  children: ReactNode;
  /** Max-width class for the DialogContent. */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS: Record<NonNullable<EntityFormDialogProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

/**
 * Generic create/edit dialog. Owns the submit lifecycle: disables the
 * submit button while in-flight, toasts errors, and closes on success.
 */
export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = "Save",
  children,
  size = "md",
}: EntityFormDialogProps) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await onSubmit();
      if (result !== false) onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SIZE_CLASS[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>
        <div className="grid gap-3 py-2">{children}</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" type="button">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}