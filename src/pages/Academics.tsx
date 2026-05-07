import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Clock, GraduationCap, Plus, Edit, Trash2,
  MoreHorizontal, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ClassRow = Tables<"classes">;
type StaffOption = { id: string; first_name: string; last_name: string };

const emptyForm = {
  name: "",
  grade_level: "",
  academic_year: "",
  capacity: "40",
  teacher_id: "",
};

export default function Academics() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;

  const [classes, setClasses] = useState<(ClassRow & { teacher?: { first_name: string; last_name: string } | null })[]>([]);
  const [teachers, setTeachers] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("*, teacher:staff(first_name, last_name)")
      .eq("school_id", schoolId)
      .order("name");

    if (error) {
      toast({ title: "Error loading classes", description: error.message, variant: "destructive" });
    } else {
      setClasses((data as any) || []);
    }
    setLoading(false);
  }, [schoolId]);

  const fetchStudentCounts = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from("students")
      .select("grade")
      .eq("school_id", schoolId)
      .eq("status", "active");
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((s) => { if (s.grade) counts[s.grade] = (counts[s.grade] || 0) + 1; });
      setStudentCounts(counts);
    }
  }, [schoolId]);

  const fetchTeachers = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("first_name");
    setTeachers(data || []);
  }, [schoolId]);

  useEffect(() => { fetchClasses(); fetchStudentCounts(); fetchTeachers(); }, [fetchClasses, fetchStudentCounts, fetchTeachers]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (cls: ClassRow) => {
    setEditing(cls);
    setForm({
      name: cls.name,
      grade_level: cls.grade_level || "",
      academic_year: cls.academic_year || "",
      capacity: String(cls.capacity || 40),
      teacher_id: cls.teacher_id || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId) return;
    if (!form.name.trim()) {
      toast({ title: "Class name is required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      grade_level: form.grade_level.trim() || null,
      academic_year: form.academic_year.trim() || null,
      capacity: parseInt(form.capacity) || 40,
      teacher_id: form.teacher_id || null,
      school_id: schoolId,
    };

    if (editing) {
      const { error } = await supabase.from("classes").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Error updating class", description: error.message, variant: "destructive" });
      else toast({ title: "Class updated" });
    } else {
      const { error } = await supabase.from("classes").insert(payload);
      if (error) toast({ title: "Error adding class", description: error.message, variant: "destructive" });
      else toast({ title: "Class added" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchClasses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("classes").delete().eq("id", deleteTarget.id);
    if (error) toast({ title: "Error deleting class", description: error.message, variant: "destructive" });
    else toast({ title: "Class deleted" });
    setDeleting(false);
    setDeleteTarget(null);
    fetchClasses();
  };

  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);
  const avgSize = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;

  const summaryCards = [
    { label: "Total Classes", value: String(classes.length), icon: BookOpen },
    { label: "Total Students", value: String(totalStudents), icon: Users },
    { label: "Teachers Assigned", value: String(classes.filter((c) => c.teacher_id).length), icon: GraduationCap },
    { label: "Avg Class Size", value: String(avgSize), icon: Clock },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classes & Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage classes, subjects, and academic schedules</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Add Class</Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Class Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No classes yet</p>
          <p className="text-xs text-muted-foreground/70">Add your first class to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow group relative"
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-sm gap-2" onClick={() => openEdit(cls)}><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={() => setDeleteTarget(cls)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-card-foreground">{cls.name}</h3>
                <Badge variant="secondary" className="text-[11px]">
                  {studentCounts[cls.name] || studentCounts[cls.grade_level || ""] || 0} students
                </Badge>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {cls.teacher ? `${cls.teacher.first_name} ${cls.teacher.last_name}` : "No teacher assigned"}
                </div>
                {cls.grade_level && (
                  <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> {cls.grade_level}</div>
                )}
                <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Capacity: {cls.capacity || 40}</div>
                {cls.academic_year && (
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {cls.academic_year}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Class Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grade 10A" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Input value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} placeholder="e.g. Grade 10" />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} min="1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Class Teacher</Label>
              <Select value={form.teacher_id || "__none__"} onValueChange={(v) => setForm({ ...form, teacher_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="e.g. 2026" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
