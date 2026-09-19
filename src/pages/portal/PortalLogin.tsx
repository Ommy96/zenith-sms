import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { PublicAuthShell } from "@/components/public/PublicExperience";

export default function PortalLogin() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [, setEmailForVerify] = useState("");
  const navigate = useNavigate();

  const sendCode = async () => {
    if (!phone.trim()) return toast.error("Enter your phone number");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("portal-send-otp", { body: { phone } });
    setSending(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error || error?.message || "Failed to send code");
    }
    setMaskedPhone((data as any).masked);
    setStep("code");
    toast.success("Code sent via SMS");
  };

  const verify = async () => {
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("portal-verify-otp", { body: { phone, code } });
    if (error || (data as any)?.error) {
      setVerifying(false);
      return toast.error((data as any)?.error || error?.message || "Invalid code");
    }
    const { email, email_otp } = data as any;
    setEmailForVerify(email);
    const { error: sErr } = await supabase.auth.verifyOtp({ email, token: email_otp, type: "magiclink" });
    setVerifying(false);
    if (sErr) return toast.error(sErr.message);
    toast.success("Welcome!");
    navigate("/portal", { replace: true });
  };

  return (
    <PublicAuthShell eyebrow="PARENT PORTAL" title="Stay close to every school day." description="Your secure window into fees, school updates, and downloadable receipts." benefits={["View fee balances and payment history", "Receive school announcements", "Download receipts when you need them"]}>
      <div className="zenith-panel rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            {step === "phone" ? <Phone className="h-7 w-7 text-primary" /> : <ShieldCheck className="h-7 w-7 text-primary" />}
          </div>
          <h1 className="pt-3 text-3xl font-semibold">Parent Portal</h1>
          <p className="text-sm text-muted-foreground">
            {step === "phone" ? "Sign in with your registered phone number." : `Enter the 6-digit code sent to ${maskedPhone}`}
          </p>
        </div>
        <div className="mt-7 space-y-4">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input
                  type="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                />
              </div>
              <Button className="h-11 w-full" onClick={sendCode} disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send verification code
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Verification code</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  className="h-14 text-center font-mono text-2xl tracking-[0.35em]"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                />
              </div>
              <Button className="h-11 w-full" onClick={verify} disabled={verifying}>
                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify & sign in
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => { setStep("phone"); setCode(""); }}>
                Use a different phone
              </Button>
            </>
          )}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Not a parent? <a href="/auth/login" className="text-primary hover:underline">Staff sign in →</a>
          </p>
        </div>
      </div>
    </PublicAuthShell>
  );
}