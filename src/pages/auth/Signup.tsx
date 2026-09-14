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
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  school_name: z.string().trim().min(2, "Enter your school name").max(120),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export default function Signup() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useZodForm(schema, {
    defaultValues: { full_name: "", email: "", phone: "", school_name: "", password: "" },
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">Z</div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start managing your school with Zenith</p>
        </div>

        <ZodForm form={form} onSubmit={onSubmit} className="space-y-4">
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
              <FormControl><Input type="password" autoComplete="new-password" placeholder="At least 8 characters" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
          </Button>
        </ZodForm>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
