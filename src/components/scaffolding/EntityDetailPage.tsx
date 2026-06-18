import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export interface EntityDetailTab {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface EntityDetailPageProps {
  /** Back link (e.g. "/students"). Hidden if absent. */
  backTo?: string;
  backLabel?: string;
  /** Header content. */
  title: string;
  subtitle?: ReactNode;
  avatarUrl?: string | null;
  avatarFallback?: string;
  /** Pill badges shown below the title. */
  badges?: Array<{ label: string; variant?: "default" | "secondary" | "outline" | "destructive" }>;
  /** Action buttons in the header (right side). */
  actions?: ReactNode;
  /** Tabbed content. */
  tabs: EntityDetailTab[];
  defaultTab?: string;
}

/**
 * Standardized profile-page scaffold: header card with avatar/title/actions
 * and a tabbed body. Used for student/staff/etc. profiles.
 */
export function EntityDetailPage({
  backTo,
  backLabel = "Back",
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  badges,
  actions,
  tabs,
  defaultTab,
}: EntityDetailPageProps) {
  const initial = (avatarFallback ?? title).slice(0, 2).toUpperCase();
  return (
    <div className="space-y-6 max-w-7xl">
      {backTo && (
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {backLabel}
          </Link>
        </Button>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
              {subtitle && (
                <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
              )}
              {badges && badges.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {badges.map((b, i) => (
                    <Badge key={i} variant={b.variant ?? "outline"}>
                      {b.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        </Card>
      </motion.div>

      <Tabs defaultValue={defaultTab ?? tabs[0]?.value} className="w-full">
        <TabsList className="flex-wrap h-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6">
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}