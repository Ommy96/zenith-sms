import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_KEY = "zenith.public-theme";

export function usePublicTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { theme, toggleTheme: () => setTheme((value) => value === "dark" ? "light" : "dark") };
}

export function ZenithMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-3" aria-label="Zenith home">
      <span className="grid h-9 w-9 place-items-center rounded-md border border-primary/40 bg-primary/10 font-semibold text-primary">Z</span>
      <span>
        <span className="block text-sm font-semibold text-foreground">ZENITH</span>
        {!compact && <span className="block text-xs text-muted-foreground">School Operating System</span>}
      </span>
    </Link>
  );
}

export function PublicThemeToggle({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onToggle} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`} title={`Use ${theme === "dark" ? "light" : "dark"} theme`}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

export function TopographicBackdrop() {
  return (
    <svg className="zenith-topography" viewBox="0 0 1200 800" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M-60 170C120 20 250 280 430 130S770 40 930 180s270 30 360-90" />
        <path d="M-80 220C90 70 260 330 450 175S800 80 960 230s250 25 340-70" />
        <path d="M-100 275C80 115 275 385 470 225S830 125 990 280s240 15 330-75" />
        <path d="M-120 335C65 165 290 440 495 280S850 180 1020 340s230 5 320-80" />
        <path d="M-140 400C50 220 305 495 520 340S875 245 1050 405s220-5 310-85" />
        <path d="M-160 470C40 280 320 555 545 405S900 315 1080 475s205-15 300-90" />
        <path d="M-180 545C30 345 335 620 570 475S925 390 1110 550s195-25 290-95" />
        <path d="M-200 625C20 415 350 690 595 550S950 470 1140 630s185-35 280-100" />
      </g>
    </svg>
  );
}

export function GoogleScaffoldButton() {
  return (
    <Button type="button" variant="outline" className="h-11 w-full" onClick={() => toast.info("Google sign-in not yet configured", { duration: 4000 })}>
      <span className="font-semibold" aria-hidden="true">G</span>
      Continue with Google
    </Button>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const label = score < 2 ? "Weak" : score < 4 ? "Good" : "Strong";
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((item) => <span key={item} className={cn("h-1 rounded-full bg-muted", item <= score && "bg-primary")} />)}
      </div>
      <p className="text-xs text-muted-foreground">Password strength: {label}</p>
    </div>
  );
}

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: { label: string; to: string };
  benefits?: string[];
  single?: boolean;
};

export function PublicAuthShell({ children, eyebrow = "ZENITH", title, description, action, benefits, single = false }: AuthShellProps) {
  const { theme, toggleTheme } = usePublicTheme();
  return (
    <div className="zenith-public min-h-screen bg-background text-foreground" data-theme={theme}>
      <div className="relative min-h-screen overflow-hidden">
        <TopographicBackdrop />
        <header className="absolute inset-x-0 top-0 z-20 flex h-20 items-center justify-between px-5 lg:px-10">
          <ZenithMark />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/">Back to Zenith</Link></Button>
            <PublicThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className={cn("relative z-10 grid min-h-screen pt-20", single ? "place-items-center px-4 py-24" : "lg:grid-cols-2")}>
          <section className={cn("flex items-center justify-center px-4 py-12 sm:px-8", single && "w-full p-0")}>
            <div className={cn("w-full", single ? "max-w-md" : "max-w-lg")}>{children}</div>
          </section>
          {!single && (
            <section className="order-last flex min-h-[440px] items-center border-t border-border bg-card/50 px-6 py-16 lg:min-h-0 lg:border-l lg:border-t-0 lg:px-16">
              <div className="mx-auto max-w-xl">
                <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">{eyebrow}</span>
                <h2 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
                <p className="mt-4 max-w-lg text-md leading-relaxed text-muted-foreground">{description}</p>
                {benefits && (
                  <ul className="mt-7 space-y-3">
                    {benefits.map((benefit) => <li key={benefit} className="flex items-center gap-3 text-sm text-secondary-foreground"><Check className="h-4 w-4 text-primary" />{benefit}</li>)}
                  </ul>
                )}
                {action && <Button asChild variant="outline" className="mt-8"><Link to={action.to}>{action.label}</Link></Button>}
                <p className="mt-12 text-xs text-muted-foreground">Purpose-built for African schools.</p>
              </div>
            </section>
          )}
        </main>
        <footer className="absolute inset-x-0 bottom-0 z-20 hidden items-center justify-between px-10 py-5 text-xs text-muted-foreground lg:flex">
          <span>A product of Infera Tech Solutions</span>
          <span>Privacy Policy · Terms</span>
        </footer>
      </div>
    </div>
  );
}