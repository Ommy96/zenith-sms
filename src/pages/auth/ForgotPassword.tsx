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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!sent && (
          <ZodForm form={form} onSubmit={onSubmit} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@school.edu" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
            </Button>
          </ZodForm>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
