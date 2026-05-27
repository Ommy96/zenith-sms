import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly_usd: number;
  price_annual_usd: number;
  max_students: number | null;
  max_staff: number | null;
  features: string[];
  sort_order: number;
}

interface BillingInvoice {
  id: string;
  invoice_number: string;
  plan_code: string;
  amount_usd: number;
  currency: string;
  period_start: string;
  period_end: string;
  status: string;
  paid_at: string | null;
  hosted_invoice_url: string | null;
}

export default function Billing() {
  const { tenant, refresh } = useTenant();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const [{ data: p }, { data: i }] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("tenant_billing_invoices").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(12),
      ]);
      setPlans((p as any) ?? []);
      setInvoices((i as any) ?? []);
      setLoading(false);
    })();
  }, [tenant]);

  const switchPlan = async (code: string) => {
    if (!tenant) return;
    setSwitching(code);
    const { error } = await supabase
      .from("tenants")
      .update({ subscription_plan: code as any, subscription_status: "active" as any })
      .eq("id", tenant.id);
    if (error) toast.error(error.message);
    else { toast.success(`Switched to ${code.toUpperCase()} plan`); await refresh(); }
    setSwitching(null);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground">Current plan: <span className="font-medium text-foreground capitalize">{tenant?.subscription_plan}</span> · Status: <Badge variant={tenant?.subscription_status === "active" ? "default" : "secondary"} className="ml-1 capitalize">{tenant?.subscription_status}</Badge></p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={cycle === "monthly" ? "default" : "outline"} size="sm" onClick={() => setCycle("monthly")}>Monthly</Button>
        <Button variant={cycle === "annual" ? "default" : "outline"} size="sm" onClick={() => setCycle("annual")}>Annual <Badge variant="secondary" className="ml-2">Save ~17%</Badge></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan) => {
          const isCurrent = plan.code === tenant?.subscription_plan;
          const price = cycle === "monthly" ? plan.price_monthly_usd : plan.price_annual_usd;
          const isEnterprise = plan.code === "enterprise";
          return (
            <Card key={plan.id} className={isCurrent ? "border-primary shadow-md" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
                <div className="pt-2">
                  {isEnterprise ? (
                    <div className="text-2xl font-bold">Contact us</div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-sm text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm space-y-1.5">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>{f}</span></li>
                  ))}
                </ul>
                {plan.max_students && <p className="text-xs text-muted-foreground">Up to {plan.max_students.toLocaleString()} students</p>}
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || switching === plan.code}
                  onClick={() => isEnterprise ? window.open("mailto:sales@zenith.app") : switchPlan(plan.code)}
                >
                  {switching === plan.code ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? "Current plan" : isEnterprise ? "Talk to sales" : "Switch plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Invoice history</CardTitle>
          <CardDescription>Past subscription charges</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No invoices yet. You're on a trial.</p>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(inv.period_start), "MMM d")} – {format(new Date(inv.period_end), "MMM d, yyyy")} · {inv.plan_code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${Number(inv.amount_usd).toFixed(2)}</span>
                    <Badge variant={inv.status === "paid" ? "default" : "secondary"} className="capitalize">{inv.status}</Badge>
                    {inv.hosted_invoice_url && <Button variant="outline" size="sm" asChild><a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">View</a></Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}