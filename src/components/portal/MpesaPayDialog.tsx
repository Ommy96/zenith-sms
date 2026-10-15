import { ReactNode, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortal } from "@/contexts/PortalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Sends an M-Pesa STK push for the active child (existing mpesa-stk-push function). */
export function MpesaPayDialog({ amount, children }: { amount: number; children: ReactNode }) {
  const { activeChild, guardian, currency } = usePortal();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState("");
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    if (!activeChild) return;
    if (!phone || !Number(value)) return toast.error("Enter your M-Pesa number and amount");
    setPaying(true);
    const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
      body: { tenant_id: activeChild.tenant_id, student_id: activeChild.id, phone, amount: Number(value),
        account_reference: activeChild.admission_number || activeChild.id },
    });
    setPaying(false);
    if (error || (data as any)?.error) return toast.error("Payment request failed. Please try again.");
    toast.success("Check your phone and enter your M-Pesa PIN");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setValue(String(Math.round(amount))); setPhone(guardian?.phone_primary || ""); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Pay with M-Pesa</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1"><Label className="text-base">M-Pesa number</Label>
            <Input className="h-12 text-base" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" /></div>
          <div className="space-y-1"><Label className="text-base">Amount ({currency})</Label>
            <Input className="h-12 text-base" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} /></div>
          <Button className="min-h-12 w-full text-base" onClick={pay} disabled={paying}>
            {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send payment request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
