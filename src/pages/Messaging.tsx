import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { ComposeTab } from "@/components/messaging/ComposeTab";
import { TemplatesTab } from "@/components/messaging/TemplatesTab";
import { CampaignsTab } from "@/components/messaging/CampaignsTab";
import { HistoryTab } from "@/components/messaging/HistoryTab";
import { SettingsTab } from "@/components/messaging/SettingsTab";
import { MessageSquare } from "lucide-react";

export default function Messaging() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? undefined;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Messaging</h1>
            <p className="text-sm text-muted-foreground">Compose, broadcast, and track messages across SMS, WhatsApp, and email.</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="compose" className="mt-4"><ComposeTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="campaigns" className="mt-4"><CampaignsTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="history" className="mt-4"><HistoryTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab tenantId={tenantId} /></TabsContent>
      </Tabs>
    </div>
  );
}