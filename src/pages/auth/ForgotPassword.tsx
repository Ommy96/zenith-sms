import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useZodForm, ZodForm, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/forms/Form";
import { PublicAuthShell } from "@/components/public/PublicExperience";

const schema = z.object({ email: z.string().trim().email("Enter a valid email address") });

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useZodForm(schema, { defaultValues: { email: "" } });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send the reset link", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Reset link sent", { duration: 3000 });
  };

  return (
    <PublicAuthShell single>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="zenith-panel rounded-xl border border-border bg-card p-6 sm:p-8">
          <h1 className="text-3xl font-semibold">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
          </p>
        {!sent && (
          <ZodForm form={form} onSubmit={onSubmit} className="mt-7 space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@school.edu" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="h-11 w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
            </Button>
          </ZodForm>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/auth/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
        </p>
      </motion.div>
    </PublicAuthShell>
  );
}
