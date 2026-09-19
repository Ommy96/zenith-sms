import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, BookOpenCheck, Check, MessageSquareText, ReceiptText, Smartphone, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PublicThemeToggle, TopographicBackdrop, usePublicTheme, ZenithMark } from "@/components/public/PublicExperience";
import { cn } from "@/lib/utils";

const features = [
  {
    eyebrow: "FEES & PAYMENTS",
    title: "Fee management that works with M-Pesa",
    description: "Match payments automatically, send clear reminders, and give every family a reliable account history without chasing spreadsheets.",
    points: ["Automatic M-Pesa matching", "Accurate balances in real time", "Receipts ready to download"],
    icon: WalletCards,
    preview: "fees",
  },
  {
    eyebrow: "ACADEMICS",
    title: "CBC-native curriculum and reporting",
    description: "Run teaching, assessment, and reporting around the curriculum your school actually uses—from early years through junior secondary.",
    points: ["CBC competencies and values", "Clear learner progress", "Report cards without rework"],
    icon: BookOpenCheck,
    preview: "academics",
  },
  {
    eyebrow: "COMMUNICATION",
    title: "Parent communication in three taps",
    description: "Reach the right families quickly with fee updates, school notices, and useful information in channels they already understand.",
    points: ["Targeted school updates", "Parent portal access", "Simple message history"],
    icon: MessageSquareText,
    preview: "messages",
  },
] as const;

const plans = [
  { name: "Starter", description: "For growing schools establishing one reliable system.", features: ["Student records", "Fees and receipts", "Attendance", "Parent portal"] },
  { name: "Standard", description: "For established schools connecting academics and operations.", features: ["Everything in Starter", "Exams and report cards", "M-Pesa reconciliation", "School messaging"], featured: true },
  { name: "Pro", description: "For larger schools ready for advanced automation and insight.", features: ["Everything in Standard", "AI-assisted workflows", "Multi-department reporting", "Priority support"] },
];

function ProductPreview({ type }: { type: "fees" | "academics" | "messages" }) {
  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-xl border border-border bg-card p-5 shadow-md sm:p-7">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div><div className="h-2.5 w-24 rounded-full bg-muted" /><div className="mt-2 h-2 w-16 rounded-full bg-primary/30" /></div>
        <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">LIVE</span>
      </div>
      {type === "fees" && <div className="grid gap-3 pt-5 sm:grid-cols-2"><div className="rounded-lg border border-border bg-background p-4"><ReceiptText className="text-primary" /><p className="mt-7 text-xs text-muted-foreground">COLLECTED THIS TERM</p><p className="mt-1 font-mono text-2xl font-medium">KES 2.48M</p></div><div className="rounded-lg border border-border bg-background p-4"><BarChart3 className="text-success" /><div className="mt-8 flex h-20 items-end gap-2">{[45, 72, 58, 90, 76].map((height) => <span key={height} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${height}%` }} />)}</div></div><div className="rounded-lg border border-border bg-background p-4 sm:col-span-2"><div className="flex items-center justify-between text-sm"><span>M-Pesa payment matched</span><span className="font-mono text-success">+24,000</span></div></div></div>}
      {type === "academics" && <div className="space-y-3 pt-5">{["Communication & collaboration", "Critical thinking", "Digital literacy"].map((item, index) => <div key={item} className="rounded-lg border border-border bg-background p-4"><div className="flex items-center justify-between text-sm"><span>{item}</span><span className="font-mono text-primary">{[82, 74, 88][index]}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${[82, 74, 88][index]}%` }} /></div></div>)}</div>}
      {type === "messages" && <div className="space-y-3 pt-5"><div className="mr-12 rounded-lg border border-border bg-background p-4 text-sm">Your Term 2 fee statement is ready to view.</div><div className="ml-12 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">Thank you. Payment will be made tomorrow.</div><div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"><Smartphone className="text-primary" /><span className="text-xs text-muted-foreground">Delivered to 428 parents</span></div></div>}
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = usePublicTheme();

  return (
    <div className="zenith-public min-h-screen bg-background text-foreground" data-theme={theme}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8">
          <ZenithMark compact />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex"><a href="#schools">For Schools</a><Link to="/portal/login">Parents</Link><a href="#pricing">Pricing</a><a href="#about">About</a></nav>
          <div className="flex items-center gap-1"><PublicThemeToggle theme={theme} onToggle={toggleTheme} />{user ? <Button asChild size="sm"><Link to="/app">Open workspace</Link></Button> : <><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth/login">Sign in</Link></Button><Button asChild size="sm"><Link to="/auth/signup">Get started</Link></Button></>}</div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-b border-border">
          <TopographicBackdrop />
          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] flex-col items-center justify-center px-4 py-20 text-center sm:px-8">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="max-w-5xl">
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">BUILT IN AFRICA · FOR AFRICAN SCHOOLS</span>
              <h1 className="mt-7 text-4xl font-semibold leading-tight sm:text-6xl lg:text-7xl">The Operating System<br className="hidden sm:block" /> for African Schools</h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">Manage students, fees, attendance, and parent communication—all in one place. Built for schools in Kenya, Uganda, Tanzania, and beyond.</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 px-6"><Link to="/auth/signup">Get started <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="h-12 px-6"><a href="mailto:hello@zenith-os.app?subject=Zenith%20demo">Book a demo</a></Button></div>
              <p className="mt-8 text-xs text-muted-foreground">Trusted by schools coming soon</p>
            </motion.div>
          </div>
        </section>

        <section id="schools" className="border-b border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] space-y-24 px-4 sm:px-8">
            {features.map((feature, index) => <div key={feature.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"><div className={cn(index % 2 === 1 && "lg:order-2")}><span className="font-mono text-xs text-primary">{feature.eyebrow}</span><feature.icon className="mt-6 h-9 w-9 text-primary" /><h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">{feature.title}</h2><p className="mt-4 text-md leading-relaxed text-muted-foreground">{feature.description}</p><ul className="mt-7 space-y-3">{feature.points.map((point) => <li key={point} className="flex items-center gap-3 text-sm"><Check className="h-4 w-4 text-success" />{point}</li>)}</ul></div><div className={cn(index % 2 === 1 && "lg:order-1")}><ProductPreview type={feature.preview} /></div></div>)}
          </div>
        </section>

        <section className="border-b border-border bg-card/40 py-16">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 text-center sm:px-8 lg:grid-cols-2"><div><p className="font-mono text-xs text-primary">BUILT FOR</p><div className="mt-5 flex flex-wrap justify-center gap-3">{["KE", "UG", "TZ", "RW"].map((item) => <span key={item} className="rounded-md border border-border bg-background px-5 py-3 font-mono text-sm">{item}</span>)}</div></div><div><p className="font-mono text-xs text-primary">CURRICULA SUPPORTED</p><div className="mt-5 flex flex-wrap justify-center gap-3">{["CBC", "8-4-4", "IGCSE", "Cambridge", "IB"].map((item) => <span key={item} className="rounded-md border border-border bg-background px-4 py-3 text-sm">{item}</span>)}</div></div></div>
        </section>

        <section id="pricing" className="py-20 sm:py-28"><div className="mx-auto max-w-[1200px] px-4 sm:px-8"><div className="max-w-2xl"><span className="font-mono text-xs text-primary">SIMPLE PRICING</span><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">A plan for every stage of growth.</h2></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{plans.map((plan) => <div key={plan.name} className={cn("rounded-xl border bg-card p-6", plan.featured ? "border-primary" : "border-border")}><div className="flex items-center justify-between"><h3 className="text-xl font-semibold">{plan.name}</h3>{plan.featured && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">Most popular</span>}</div><p className="mt-3 text-sm text-muted-foreground">{plan.description}</p><ul className="mt-6 space-y-3 text-sm">{plan.features.map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{item}</li>)}</ul><Button asChild className="mt-8 w-full" variant={plan.featured ? "default" : "outline"}><Link to="/auth/signup">Get started</Link></Button></div>)}</div><div className="mt-8 text-center"><Link to="/auth/signup" className="text-sm text-primary hover:underline">See full pricing <ArrowRight className="inline h-4 w-4" /></Link></div></div></section>

        <section id="about" className="border-y border-border bg-card/40 py-20"><div className="mx-auto max-w-3xl px-4 text-center sm:px-8"><h2 className="text-3xl font-semibold sm:text-4xl">Run your school with clarity.</h2><p className="mt-4 text-muted-foreground">Bring your team, families, and school records into one dependable workspace.</p><Button asChild size="lg" className="mt-8 h-12 px-6"><Link to="/auth/signup">Create your school account <ArrowRight /></Link></Button></div></section>
      </main>

      <footer className="py-12"><div className="mx-auto max-w-[1200px] px-4 sm:px-8"><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"><div><ZenithMark /><p className="mt-4 max-w-xs text-xs text-muted-foreground">One calm, connected system for the work that keeps a school moving.</p></div><div><p className="text-sm font-medium">Product</p><div className="mt-3 space-y-2 text-sm text-muted-foreground"><a className="block" href="#schools">For schools</a><Link className="block" to="/portal/login">Parent portal</Link><a className="block" href="#pricing">Pricing</a></div></div><div><p className="text-sm font-medium">Company</p><div className="mt-3 space-y-2 text-sm text-muted-foreground"><a className="block" href="mailto:hello@zenith-os.app">Contact</a><a className="block" href="#about">About</a></div></div><div><p className="text-sm font-medium">Legal</p><div className="mt-3 space-y-2 text-sm text-muted-foreground"><span className="block">Privacy Policy</span><span className="block">Terms</span></div></div></div><div className="mt-10 flex flex-col justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row"><span>A product of Infera Tech Solutions</span><span>© {new Date().getFullYear()} Zenith OS</span></div></div></footer>
    </div>
  );
}