import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-4 px-4 sticky top-0 z-30">
      <SidebarTrigger className="h-8 w-8" />

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students, classes, fees..."
            className="pl-9 h-9 bg-secondary border-0 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  );
}
