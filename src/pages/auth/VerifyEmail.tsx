import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email.trim()) return toast.error("Enter the email you signed up with");
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/setup/provisioning` },
    });
    setSending(false);
    if (error) return toast.error("Couldn't resend the email", { description: error.message });
    toast.success("Verification email sent", { duration: 3000 });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Verify your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
              <li>Open the email we just sent you{email ? ` at ${email}` : ""}.</li>
              <li>Click the verification link.</li>
              <li>You'll be signed in and taken straight to your school setup.</li>
            </ol>
            <div className="space-y-2">
              <Label>Didn't get it?</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
            </div>
            <Button className="w-full" onClick={resend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend verification email"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/auth/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
