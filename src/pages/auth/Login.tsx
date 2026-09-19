import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleScaffoldButton, PublicAuthShell } from "@/components/public/PublicExperience";
import { PasswordInput } from "@/components/public/PasswordInput";
import { useZodForm, ZodForm, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/forms/Form";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export default function Login() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useZodForm(schema, { defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed")) {
        toast.error("Your email isn't verified yet", {
          description: "Check your inbox for the verification link.",
          action: { label: "Resend", onClick: () => navigate("/auth/verify-email") },
        });
      } else if (msg.includes("invalid login")) {
        toast.error("Wrong email or password", { description: "Check your details and try again." });
      } else if (msg.includes("disabled") || msg.includes("banned")) {
        toast.error("This account is disabled", { description: "Contact your school administrator." });
      } else {
        toast.error("Sign in failed", { description: error.message });
      }
      return;
    }
    toast.success("Welcome back", { duration: 3000 });
    navigate("/", { replace: true });
  };

  return (
    <PublicAuthShell title="New to Zenith?" description="Set up your school's account and start managing students, fees, and communication in minutes." action={{ label: "Create school account", to: "/auth/signup" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="zenith-panel rounded-xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Welcome back. Access your school's workspace.</p>
        <div className="mt-7"><GoogleScaffoldButton /></div>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>OR CONTINUE WITH EMAIL</span><span className="h-px flex-1 bg-border" /></div>

        <ZodForm form={form} onSubmit={onSubmit} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" autoComplete="email" placeholder="you@school.edu" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><PasswordInput autoComplete="current-password" placeholder="••••••••" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground"><Checkbox />Remember me</label>
            <Link to="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </ZodForm>
        <p className="mt-6 text-center text-xs text-muted-foreground">For parent sign-in, go to the <Link to="/portal/login" className="text-primary hover:underline">parent portal</Link>.</p>
      </motion.div>
    </PublicAuthShell>
  );
}
