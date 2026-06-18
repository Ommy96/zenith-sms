import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface EnrollState { factorId: string; qr: string; secret: string; uri: string }

export default function TwoFactorPage() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<any[]>([]);
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [aal, setAal] = useState<string | null>(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const forced = params.get("required") === "1";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error) setFactors(data?.totp ?? []);
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal(aalData?.currentLevel ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEnroll = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) { toast.error(error?.message ?? "Enrollment failed"); return; }
    setEnroll({
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  };

  const verify = async () => {
    if (!enroll) return;
    setBusy(true);
    const ch = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
    if (ch.error) { setBusy(false); toast.error(ch.error.message); return; }
    const v = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: ch.data!.id,
      code,
    });
    setBusy(false);
    if (v.error) { toast.error(v.error.message); return; }
    toast.success("Two-factor authentication enabled");
    setEnroll(null);
    setCode("");
    await load();
    if (forced) navigate("/", { replace: true });
  };

  const remove = async (factorId: string) => {
    if (!confirm("Remove this authenticator? You'll need to re-enroll to keep 2FA.")) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Authenticator removed");
    load();
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const verified = factors.filter((f) => f.status === "verified");
  const hasVerified = verified.length > 0;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Two-factor authentication</h1>
        <p className="text-muted-foreground text-sm">
          Adds a one-time code from your authenticator app on top of your password.
        </p>
      </div>

      {forced && !hasVerified && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Your role requires two-factor authentication. Set it up below to continue.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Status
          </CardTitle>
          <CardDescription>
            Assurance level: <span className="font-mono">{aal ?? "—"}</span> ·{" "}
            {hasVerified ? "2FA enabled" : "2FA not configured"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <div className="font-medium">{f.friendly_name ?? "Authenticator app"}</div>
                <div className="text-xs text-muted-foreground">
                  Added {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(f.id)} disabled={busy}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!hasVerified && !enroll && (
            <Button onClick={startEnroll} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Set up authenticator app
            </Button>
          )}
        </CardContent>
      </Card>

      {enroll && (
        <Card>
          <CardHeader>
            <CardTitle>Scan with your authenticator</CardTitle>
            <CardDescription>
              Use Google Authenticator, 1Password, Authy or similar. Store the secret
              somewhere safe — it is your backup if you lose your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img src={enroll.qr} alt="2FA QR code" className="border rounded bg-white p-2" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Manual entry / backup secret</Label>
              <Input readOnly value={enroll.secret} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">
                Store this somewhere safe (password manager). It is your recovery path
                if you lose your authenticator app.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="code">6-digit code from app</Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={verify} disabled={busy || code.length !== 6}>
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verify & enable
              </Button>
              <Button variant="ghost" onClick={() => { setEnroll(null); setCode(""); }} disabled={busy}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}