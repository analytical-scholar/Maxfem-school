// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — CLASS MANAGEMENT (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Plus, RefreshCw, Edit2, Users, GraduationCap, CheckCircle2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchClasses,
  createClass,
  updateClass,
  fetchStudentEnrollments,
  type SchoolClassWithCount,
} from "@/lib/school-service";
import type { StudentEnrollment } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/classes")({
  head: () => ({
    meta: [
      { title: "Class Management — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminClassesPage,
});

function AdminClassesPage() {
  const [classes, setClasses] = useState<SchoolClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    grade_level: 7,
    arm: "A",
  });
  const [creating, setCreating] = useState(false);

  // Edit Modal
  const [editingClass, setEditingClass] = useState<SchoolClassWithCount | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    grade_level: 7,
    arm: "",
  });
  const [editing, setEditing] = useState(false);

  // Roster Modal
  const [rosterClass, setRosterClass] = useState<SchoolClassWithCount | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchClasses();
      setClasses(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Class name is required.");
      return;
    }

    setCreating(true);
    try {
      const res = await createClass({
        name: createForm.name.trim(),
        grade_level: Number(createForm.grade_level),
        arm: createForm.arm.trim() || undefined,
      });

      if (!res.success) throw new Error(res.error);

      toast.success(`Class ${createForm.name} created successfully.`);
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create class";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (c: SchoolClassWithCount) => {
    setEditingClass(c);
    setEditForm({
      name: c.name,
      grade_level: c.grade_level,
      arm: c.arm || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setEditing(true);
    try {
      const res = await updateClass(editingClass.id, {
        name: editForm.name.trim(),
        grade_level: Number(editForm.grade_level),
        arm: editForm.arm.trim() || null,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Class updated successfully.");
      setEditingClass(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update class";
      toast.error(msg);
    } finally {
      setEditing(false);
    }
  };

  const handleOpenRoster = async (c: SchoolClassWithCount) => {
    setRosterClass(c);
    setLoadingRoster(true);
    try {
      const data = await fetchStudentEnrollments(c.id);
      setEnrollments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoster(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Classroom Structures & Grade Arms"
        subtitle="Configure school classes, grade levels (JSS1 - SSS3), and student rosters"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Classes" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1.5 size-4" />
              Create Class
            </Button>
          </div>
        }
      >
        {/* Classes Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
              <span>Loading classroom structures...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground bg-card">
              <Layers className="mx-auto size-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No classes configured</p>
              <p className="text-xs">Click "Create Class" to add JSS or SSS class arms.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/5 text-primary"
                    >
                      Grade Level {cls.grade_level}
                    </Badge>
                    {cls.arm && (
                      <Badge variant="secondary" className="font-mono">
                        Arm {cls.arm}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                    {cls.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="size-3.5 text-primary" />
                    <span>{cls.student_count || 0} active students enrolled</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenRoster(cls)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <GraduationCap className="mr-1 size-3.5" />
                    View Roster
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(cls)}
                    className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                  >
                    <Edit2 className="mr-1 size-3.5" />
                    Edit
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Class Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Create School Class</DialogTitle>
              <DialogDescription className="text-xs">
                Add a new class arm for academic management and student allocations.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Class Name *</label>
                <Input
                  required
                  placeholder="e.g. JSS 1 Gold or SSS 2 Science"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Grade Level (7-12) *
                  </label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={12}
                    value={createForm.grade_level}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, grade_level: Number(e.target.value) })
                    }
                    className="text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    7 = JSS1, 10 = SSS1
                  </span>
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Arm (Optional)</label>
                  <Input
                    placeholder="e.g. A, B, Gold, Diamond"
                    value={createForm.arm}
                    onChange={(e) => setCreateForm({ ...createForm, arm: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating..." : "Create Class"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Class Modal */}
        <Dialog
          open={Boolean(editingClass)}
          onOpenChange={(open) => !open && setEditingClass(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Class</DialogTitle>
              <DialogDescription className="text-xs">
                Modify class details for {editingClass?.name}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Class Name</label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Grade Level</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={12}
                    value={editForm.grade_level}
                    onChange={(e) =>
                      setEditForm({ ...editForm, grade_level: Number(e.target.value) })
                    }
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Arm</label>
                  <Input
                    value={editForm.arm}
                    onChange={(e) => setEditForm({ ...editForm, arm: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingClass(null)}
                  disabled={editing}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editing}>
                  {editing ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Class Roster Modal */}
        <Dialog open={Boolean(rosterClass)} onOpenChange={(open) => !open && setRosterClass(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display">Class Roster — {rosterClass?.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Students currently enrolled in {rosterClass?.name} ({enrollments.length} enrolled)
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs">
              {loadingRoster ? (
                <div className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto size-4 animate-spin mb-1 text-primary" />
                  <span>Loading class roster...</span>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
                  <p>No students enrolled in this class yet.</p>
                  <p className="text-[11px] mt-1">
                    Go to "Student Enrollments" or register a new student to place them in this
                    class.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-lg border border-border">
                  {enrollments.map((enr) => (
                    <div key={enr.id} className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-semibold text-foreground">
                          {enr.student?.first_name} {enr.student?.last_name}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          Admission No:{" "}
                          <span className="font-mono">{enr.student?.admission_number}</span> •{" "}
                          Session: {enr.academic_session?.name}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 bg-emerald-50"
                      >
                        {enr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setRosterClass(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
