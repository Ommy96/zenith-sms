import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarCheck, ReceiptText, FileCheck2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ZenithMark } from "@/components/public/PublicExperience";
import { SteppedSummit } from "@/components/public/SteppedSummit";

const contact = "mailto:hello@zenith-os.app";
const demo = `${contact}?subject=Zenith%20demo`;
const features = [
  { icon: CalendarCheck, number: "01", title: "Daily operations", copy: "Attendance, timetables, and student records. The school day, connected." },
  { icon: ReceiptText, number: "02", title: "Fees that reconcile themselves", copy: "M-Pesa integration, auto-matched payments, and a parent portal that keeps balances clear." },
  { icon: FileCheck2, number: "03", title: "Reports parents trust", copy: "Automated receipts, statements, and report cards delivered by WhatsApp." },
];

export default function Landing() {
  const { user } = useAuth();
  return <div className="zenith-public zenith-landing min-h-screen bg-background text-foreground" data-theme="dark">
    <header className="border-b border-border">
      <div className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-5 sm:px-8">
        <ZenithMark compact />
        <nav className="flex items-center gap-3 sm:gap-7" aria-label="Main navigation">
          <a href="#schools" className="hidden text-sm text-muted-foreground sm:block">For schools</a>
          <Button asChild variant="ghost" size="sm"><Link to={user ? "/app" : "/auth/login"}>{user ? "Open workspace" : "Sign in"}<ArrowUpRight className="h-4 w-4" /></Link></Button>
        </nav>
      </div>
    </header>
    <main>
      <section className="zenith-brand-hero border-b border-border">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center px-5 pb-16 pt-10 text-center sm:px-8 sm:pb-20 sm:pt-14">
          <SteppedSummit animated className="h-[140px] w-[140px]" />
          <h1 className="zenith-wordmark mt-3 text-4xl font-medium">Zenith</h1>
          <p className="mt-5 max-w-sm text-md text-muted-foreground">School operations software built for African schools</p>
          <div className="mt-8 flex w-full max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6"><a href={demo}>Book a demo<ArrowUpRight className="h-4 w-4" /></a></Button>
            <Button asChild variant="outline" size="lg" className="h-12 border-foreground/40 bg-transparent px-6"><Link to="/portal/login">See parent portal<ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <p className="mt-10 text-xs text-muted-foreground">BY INFERA TECH SOLUTIONS · NAIROBI, KENYA</p>
        </div>
      </section>
      <section id="schools" className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="flex items-center gap-4"><span className="h-px w-8 bg-primary" /><h2 className="text-2xl">What Zenith does</h2></div>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {features.map(({ icon: Icon, number, title, copy }) => <article key={number} className="border-t border-border pt-6">
              <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-primary" strokeWidth={1.5} /><span className="font-mono text-xs text-muted-foreground">{number}</span></div>
              <h3 className="zenith-wordmark mt-6 text-xl font-medium leading-snug">{title}</h3><p className="mt-3 text-sm text-muted-foreground">{copy}</p>
            </article>)}
          </div>
        </div>
      </section>
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <h2 className="max-w-lg text-3xl">Built for the Kenyan school day</h2>
          <p className="mt-5 max-w-2xl text-md text-muted-foreground">CBC-ready, NEMIS-compatible, and connected to Safaricom Daraja. From the morning register to the last fee payment, Zenith works around the way your school runs.</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5 text-sm font-medium">
            <span className="border-l-2 border-primary pl-3">CBC<span className="block text-xs font-normal text-muted-foreground">Curriculum-ready</span></span>
            <span className="border-l-2 border-success pl-3">Safaricom M-Pesa<span className="block text-xs font-normal text-muted-foreground">Daraja integration</span></span>
            <span className="border-l-2 border-info pl-3">Africa’s Talking<span className="block text-xs font-normal text-muted-foreground">School communication</span></span>
          </div>
        </div>
      </section>
      <section className="bg-card py-16 sm:py-20">
        <div className="mx-auto max-w-[1100px] px-5 text-center sm:px-8">
          <h2 className="text-3xl">A clearer school day starts here.</h2>
          <p className="mx-auto mt-4 max-w-lg text-md text-muted-foreground">We're onboarding Kenyan schools this quarter. See how Zenith fits yours.</p>
          <Button asChild size="lg" className="mt-7 h-12 px-6"><a href={demo}>Book a 20-minute demo<ArrowUpRight className="h-4 w-4" /></a></Button>
        </div>
      </section>
    </main>
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center"><ZenithMark compact /><nav aria-label="Footer" className="flex gap-6 text-sm text-muted-foreground"><a href={`${contact}?subject=Zenith%20privacy%20policy`}>Privacy</a><a href={`${contact}?subject=Zenith%20terms`}>Terms</a><a href={contact}>Contact</a></nav></div>
        <div className="mt-7 flex flex-col justify-between gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row"><span>© 2026 Infera Tech Solutions</span><span>Built in Nairobi</span></div>
      </div>
    </footer>
  </div>;
}
