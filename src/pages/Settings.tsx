import { useState } from "react";
import { motion } from "framer-motion";
import { Building, Palette, GraduationCap, Bell, Sparkles, RotateCcw, Trash2, Loader2, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { clearDemoData, seedDemoData } from "@/lib/demoSeed";
import { AiSettingsTab } from "@/components/settings/AiSettingsTab";

export default function SettingsPage() {
  const { profile, role, refreshSchool } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "school_admin" || role === "super_admin";
  const [busy, setBusy] = useState<null | "reset" | "clear">(null);

  const handleReset = async () => {
    if (!profile?.tenant_id) return;
    setBusy("reset");
    try {
      await clearDemoData(profile.tenant_id);
      await seedDemoData(profile.tenant_id);
      await refreshSchool();
      toast({ title: "Demo data restored", description: "Sample students, fees and activity have been re-seeded." });
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleClear = async () => {
    if (!profile?.tenant_id) return;
    setBusy("clear");
    try {
      await clearDemoData(profile.tenant_id);
      await refreshSchool();
      toast({ title: "Demo data cleared", description: "Your workspace is now empty and ready for real data." });
    } catch (e: any) {
      toast({ title: "Clear failed", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your school's configuration and preferences</p>
        <Link to="/setup">
          <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Run Setup Wizard
          </Button>
        </Link>
      </motion.div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general" className="text-sm gap-1.5"><Building className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="school" className="text-sm gap-1.5"><Building className="h-3.5 w-3.5" /> School</TabsTrigger>
          <TabsTrigger value="academic" className="text-sm gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Academic</TabsTrigger>
          <TabsTrigger value="branding" className="text-sm gap-1.5"><Palette className="h-3.5 w-3.5" /> Branding</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm gap-1.5"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="ai" className="text-sm gap-1.5"><Brain className="h-3.5 w-3.5" /> AI</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Demo Data</h3>
              <p className="text-xs text-muted-foreground mt-1">Reset or remove the sample data that ships with new schools.</p>
            </div>

            {!isAdmin && (
              <p className="text-xs text-muted-foreground">Only school administrators can manage demo data.</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!isAdmin || busy !== null} className="gap-1.5">
                    {busy === "reset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Reset to demo data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset to demo data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will erase all current students, staff, attendance, invoices, exams and announcements, then re-seed fresh sample data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!isAdmin || busy !== null} className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive">
                    {busy === "clear" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Clear all demo data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all demo data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes all sample students, staff, attendance, invoices, exams and announcements. Your school configuration is kept.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="school" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground mb-4">School Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">School Name</Label>
                  <Input defaultValue="Green Valley Academy" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">School Code</Label>
                  <Input defaultValue="GVA-2024" disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input defaultValue="admin@greenvalley.edu" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Phone</Label>
                  <Input defaultValue="+1 555-0100" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm">Address</Label>
                  <Input defaultValue="123 Education Lane, Springfield, IL 62701" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm">Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Academic Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Current Academic Year</Label>
                <Select defaultValue="2025-2026">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-2026">2025–2026</SelectItem>
                    <SelectItem value="2026-2027">2026–2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Current Term</Label>
                <Select defaultValue="term2">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term1">Term 1</SelectItem>
                    <SelectItem value="term2">Term 2</SelectItem>
                    <SelectItem value="term3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Grading System</Label>
                <Select defaultValue="letter">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter (A–F)</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="gpa">GPA (4.0)</SelectItem>
                    <SelectItem value="custom">Custom Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Pass Mark (%)</Label>
                <Input type="number" defaultValue="50" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm">Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">School Branding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary border border-border" />
                  <Input defaultValue="#6366f1" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">School Logo</Label>
                <div className="h-9 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
                  Click to upload logo
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm">School Motto</Label>
                <Input defaultValue="Excellence in Education, Character in Action" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm">Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">Notification Preferences</h3>
            {[
              { label: "Fee payment reminders", desc: "Send SMS/email before fee deadlines" },
              { label: "Attendance alerts", desc: "Notify parents when student is absent" },
              { label: "Exam schedule notifications", desc: "Notify students and parents about upcoming exams" },
              { label: "Assignment deadlines", desc: "Remind students about pending assignments" },
              { label: "Low attendance warnings", desc: "Alert admins when attendance drops below threshold" },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button size="sm">Save Preferences</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <AiSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
