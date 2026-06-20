import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, MessageCircle, GraduationCap, Check, X, Sparkles,
  ShieldCheck, ArrowRight, Phone, MessageSquare, Quote, Globe2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP_NUMBER = "254700000000"; // TODO: replace with real support line
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to learn more about SomaSphere.")}`;

const PILLARS = [
  {
    icon: Wallet,
    title: "Fees that collect themselves",
    body:
      "M-Pesa STK push, automatic reconciliation by admission number, scheduled reminders on WhatsApp & SMS, and clean PDF statements parents actually open.",
  },
  {
    icon: MessageCircle,
    title: "Parents who stay informed",
    body:
      "Two-way WhatsApp inbox, absence alerts the moment a register is marked, report-card delivery in one click, and a self-service portal in their pocket.",
  },
  {
    icon: GraduationCap,
    title: "Academics with real intelligence",
    body:
      "CBC & 8-4-4 ready. Auto-generated timetables, OCR exam grading, AI report-card comments, and a Copilot that answers what your principal actually asks.",
  },
];

const PLANS = [
  { name: "Free", price: "KES 0", note: "Up to 50 students", features: ["Students & guardians", "Manual fees & receipts", "Basic attendance", "1 admin user"], cta: "Start free", highlight: false },
  { name: "Starter", price: "KES 4,000", note: "per term · up to 250 students", features: ["Everything in Free", "M-Pesa STK + reconciliation", "WhatsApp reminders (500/mo)", "Parent portal"], cta: "Start trial", highlight: false },
  { name: "Standard", price: "KES 12,000", note: "per term · up to 800 students", features: ["Everything in Starter", "Examinations + report cards", "Transport & hostel", "5,000 WhatsApp msgs/mo"], cta: "Start trial", highlight: true },
  { name: "Pro", price: "KES 25,000", note: "per term · up to 2,000 students", features: ["Everything in Standard", "AI Copilot + OCR grader", "Payroll (KE statutory)", "Priority support"], cta: "Start trial", highlight: false },
  { name: "Enterprise", price: "Custom", note: "Multi-campus & MOE pilots", features: ["Unlimited students", "Dedicated success engineer", "SSO & DPO assistance", "Custom integrations"], cta: "Talk to sales", highlight: false },
];

const COMPARE = [
  { feature: "M-Pesa Paybill + STK auto-match", us: true, zeraki: true, shulesoft: true },
  { feature: "WhatsApp Cloud API (official)", us: true, zeraki: false, shulesoft: false },
  { feature: "CBC competencies + values", us: true, zeraki: true, shulesoft: true },
  { feature: "AI report-card comments", us: true, zeraki: false, shulesoft: false },
  { feature: "OCR exam-paper grading", us: true, zeraki: false, shulesoft: false },
  { feature: "Parent self-service portal (PWA)", us: true, zeraki: true, shulesoft: true },
  { feature: "Real-time bus GPS tracking", us: true, zeraki: false, shulesoft: false },
  { feature: "NEMIS / UNEB / NECTA imports", us: true, zeraki: true, shulesoft: true },
  { feature: "Native mobile apps (iOS/Android)", us: false, zeraki: true, shulesoft: true },
  { feature: "On-premise / offline-first deployment", us: false, zeraki: false, shulesoft: true },
  { feature: "10+ years of installed base", us: false, zeraki: true, shulesoft: true },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">S</span>
            SomaSphere
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#pillars" className="hover:text-foreground">Product</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#compare" className="hover:text-foreground">Comparison</a>
            <Link to="/portal/login" className="hover:text-foreground">Parent portal</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm"><Link to="/app">Open dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
                <Button asChild size="sm"><Link to="/signup">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <Badge variant="secondary" className="mb-5 gap-1.5"><Globe2 className="h-3.5 w-3.5" />Built in Nairobi · Made for African schools</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              School management for African schools.
              <span className="block text-primary mt-2">Modern fees, parents, and academics in one place.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              SomaSphere replaces the spreadsheet, the WhatsApp group, and the dusty fee book with one calm,
              fast, multi-tenant platform — built for CBC, 8-4-4, UNEB, and NECTA.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6"><Link to="/signup">Start free <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link to="/signup?demo=1"><Sparkles className="mr-1.5 h-4 w-4" />Try a live demo</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Kenya DPA 2019 aligned</span>
              <span>·</span>
              <span>No card required</span>
              <span>·</span>
              <span>Free up to 50 students</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three things schools actually need.</h2>
          <p className="mt-3 text-muted-foreground">Everything else is built around these.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full border-border/70 hover:border-primary/40 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-accent text-accent-foreground grid place-items-center mb-4">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 border-y border-border/60 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Honest pricing in shillings.</h2>
            <p className="mt-3 text-muted-foreground">No per-message gotchas. No surprise dollar bills.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {PLANS.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.highlight ? "border-primary shadow-lg ring-1 ring-primary/30" : "border-border/70"}`}>
                {plan.highlight && (
                  <Badge className="absolute -top-2.5 left-4">Most popular</Badge>
                )}
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="text-sm font-medium text-muted-foreground">{plan.name}</div>
                  <div className="mt-2 text-3xl font-bold">{plan.price}</div>
                  <div className="text-xs text-muted-foreground mt-1">{plan.note}</div>
                  <ul className="mt-5 space-y-2 text-sm flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{f}</li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full" variant={plan.highlight ? "default" : "outline"}>
                    <Link to={plan.name === "Enterprise" ? "#contact" : "/signup"}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How we compare.</h2>
          <p className="mt-3 text-muted-foreground">We won't lie to win. Zeraki and Shulesoft are real products with real strengths — here's the honest line-by-line.</p>
        </div>
        <div className="border border-border/70 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium text-primary">SomaSphere</th>
                <th className="px-4 py-3 font-medium">Zeraki</th>
                <th className="px-4 py-3 font-medium">Shulesoft</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.feature} className={i % 2 ? "bg-muted/20" : ""}>
                  <td className="px-4 py-3">{row.feature}</td>
                  <td className="px-4 py-3">{row.us ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                  <td className="px-4 py-3">{row.zeraki ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                  <td className="px-4 py-3">{row.shulesoft ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="bg-muted/30 border-y border-border/60 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Schools shipping with us.</h2>
            <p className="mt-3 text-muted-foreground">Pilot programme open. Quotes from our first three schools land here.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-dashed">
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground italic">Testimonial pending — pilot school {i}.</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-3 w-24 bg-muted rounded mb-1.5" />
                      <div className="h-2 w-32 bg-muted/60 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-primary text-primary-foreground p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent_60%)]" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative">Ready to put the spreadsheet down?</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto relative">Set up your school in under 15 minutes. The onboarding wizard handles the rest.</p>
          <div className="mt-7 flex justify-center gap-3 relative">
            <Button asChild size="lg" variant="secondary" className="h-12 px-6"><Link to="/signup">Create my school <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><Phone className="mr-1.5 h-4 w-4" />Talk to us</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-border/60 py-12">
        <div className="container mx-auto px-4 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="flex items-center gap-2 font-semibold mb-3">
              <span className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">S</span>
              SomaSphere
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">A unified operating system for modern schools across East Africa.</p>
          </div>
          <div>
            <div className="font-medium mb-3">Product</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#pillars" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><Link to="/portal/login" className="hover:text-foreground">Parent portal</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3">Company</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="mailto:hello@somasphere.app" className="hover:text-foreground">Contact</a></li>
              <li><a href="https://status.somasphere.app" className="hover:text-foreground" target="_blank" rel="noreferrer">Status</a></li>
              <li><a href={WHATSAPP_URL} className="hover:text-foreground" target="_blank" rel="noreferrer">WhatsApp support</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3">Legal</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/dpa/policies" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><a href="/terms" className="hover:text-foreground">Terms of Service</a></li>
              <li><Link to="/dpa" className="hover:text-foreground">Data protection</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-6 border-t border-border/60 flex flex-col md:flex-row md:justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} SomaSphere. All rights reserved.</div>
          <div>Made with care in Nairobi 🇰🇪</div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-success text-success-foreground shadow-xl grid place-items-center hover:scale-105 transition-transform"
      >
        <MessageSquare className="h-6 w-6" />
      </a>
    </div>
  );
}