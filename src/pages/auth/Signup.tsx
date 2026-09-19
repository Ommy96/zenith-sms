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
import { GoogleScaffoldButton, PasswordStrength, PublicAuthShell } from "@/components/public/PublicExperience";
import { PasswordInput } from "@/components/public/PasswordInput";
import { useZodForm, ZodForm, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/forms/Form";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  school_name: z.string().trim().min(2, "Enter your school name").max(120),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  terms: z.literal(true, { errorMap: () => ({ message: "Accept the terms to continue" }) }),
});

export default function Signup() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useZodForm(schema, {
    defaultValues: { full_name: "", email: "", phone: "", school_name: "", password: "", terms: false as never },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: values.full_name.trim(),
          phone: values.phone.trim(),
          requested_school_name: values.school_name.trim(),
        },
        emailRedirectTo: `${window.location.origin}/setup/provisioning`,
      },
    });

    if (error) {
      setSubmitting(false);
      toast.error("Sign up failed", { description: error.message });
      return;
    }

    // If the project auto-confirms, we already have a session — provision immediately.
    if (data.session) {
      const { error: fnError } = await supabase.functions.invoke("create-tenant", {
        body: { school_name: values.school_name.trim(), requested_by_user_id: data.user?.id },
      });
      setSubmitting(false);
      if (fnError) {
        toast.error("We couldn't finish setting up your school", { description: fnError.message });
        navigate("/setup/provisioning", { replace: true });
        return;
      }
      toast.success("Account created", { duration: 3000 });
      navigate("/setup", { replace: true });
      return;
    }

    setSubmitting(false);
    sessionStorage.setItem("zenith.pending_school_name", values.school_name.trim());
    navigate(`/auth/verify-email?email=${encodeURIComponent(values.email.trim())}`, { replace: true });
  };

  return (
    <PublicAuthShell title="Already have a school account?" description="Return to your school's workspace and pick up exactly where you left off." action={{ label: "Sign in", to: "/auth/login" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="zenith-panel rounded-xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-3xl font-semibold">Create your school account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Set up your workspace in a few minutes.</p>
        <div className="mt-6"><GoogleScaffoldButton /></div>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>OR CONTINUE WITH EMAIL</span><span className="h-px flex-1 bg-border" /></div>

        <ZodForm form={form} onSubmit={onSubmit} className="space-y-3.5">
          <FormField control={form.control} name="full_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl><Input placeholder="Jane Wanjiru" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" autoComplete="email" placeholder="you@school.edu" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl><Input type="tel" placeholder="0712 345 678" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="school_name" render={({ field }) => (
            <FormItem>
              <FormLabel>School name</FormLabel>
              <FormControl><Input placeholder="Karama Academy" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><PasswordInput autoComplete="new-password" placeholder="At least 8 characters" {...field} /></FormControl>
              <PasswordStrength password={field.value} />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="terms" render={({ field }) => (
            <FormItem>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Checkbox checked={field.value} onCheckedChange={field.onChange} />I agree to the Terms of Service and Privacy Policy.</label>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
          </Button>
        </ZodForm>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </PublicAuthShell>
  );
}
