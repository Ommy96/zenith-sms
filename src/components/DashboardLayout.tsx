import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { DemoDataBanner } from "./DemoDataBanner";

/**
 * App shell — per design system §5 + §7.
 * - Page content max-width: 1440px, centered.
 * - Gutters: 32px desktop, 16px mobile.
 * - Top padding under topbar: 24px.
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-dvh flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <DemoDataBanner />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
