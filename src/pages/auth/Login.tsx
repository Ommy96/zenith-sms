import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">Z</div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to Zenith</p>
        </div>

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
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <FormControl><Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </ZodForm>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/auth/signup" className="text-primary font-medium hover:underline">Create one</Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Parent or student? <Link to="/portal/login" className="text-primary hover:underline">Use the portal sign-in</Link>
        </p>
      </motion.div>
    </div>
  );
}
