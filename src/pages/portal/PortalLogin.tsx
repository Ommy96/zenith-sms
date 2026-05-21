import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Phone, ShieldCheck } from "lucide-react";

export default function PortalLogin() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [emailForVerify, setEmailForVerify] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            {step === "phone" ? <Phone className="h-7 w-7 text-primary" /> : <ShieldCheck className="h-7 w-7 text-primary" />}
          </div>
          <CardTitle className="text-2xl">Portal Sign-in</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === "phone" ? "Parents and students — sign in with your registered phone number" : `Enter the 6-digit code sent to ${maskedPhone}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Button className="w-full h-12" onClick={sendCode} disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send code
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Verification code</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] h-14"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                />
              </div>
              <Button className="w-full h-12" onClick={verify} disabled={verifying}>
                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify & sign in
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => { setStep("phone"); setCode(""); }}>
                Use a different phone
              </Button>
            </>
          )}
          <p className="text-xs text-center text-muted-foreground pt-2">
            For staff sign-in, go to <a href="/login" className="text-primary underline">staff login</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}