// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER MANAGEMENT (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Briefcase,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  BookOpen,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  fetchTeacherAssignments,
} from "@/lib/school-service";
import type { Teacher, EmploymentStatus, AccountStatus, TeacherAssignment } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/teachers")({
  head: () => ({
    meta: [
      { title: "Faculty Management — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTeachersPage,
});

function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    staff_id: "",
    department: "Sciences",
    employment_status: "FULL_TIME" as EmploymentStatus,
  });
  const [creating, setCreating] = useState(false);

  // Edit Modal
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    department: "",
    employment_status: "FULL_TIME" as EmploymentStatus,
    status: "ACTIVE" as AccountStatus,
  });
  const [editing, setEditing] = useState(false);

  // View Assignments Modal
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTeachers(search, departmentFilter);
      setTeachers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const autoStaffId = `MIS/TCH/${year}/${rand}`;

    setCreateForm({
      full_name: "",
      email: "",
      phone: "",
      staff_id: autoStaffId,
      department: "Sciences",
      employment_status: "FULL_TIME",
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.full_name.trim() || !createForm.email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }

    setCreating(true);
    try {
      const res = await createTeacher({
        full_name: createForm.full_name.trim(),
        email: createForm.email.trim().toLowerCase(),
        phone: createForm.phone.trim() || undefined,
        staff_id: createForm.staff_id.trim(),
        department: createForm.department.trim(),
        employment_status: createForm.employment_status,
      });

      if (!res.success) throw new Error(res.error);

      toast.success(`Faculty member ${createForm.full_name} added successfully.`);
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create teacher";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditForm({
      full_name: teacher.profile?.full_name || "",
      phone: teacher.profile?.phone || "",
      department: teacher.department,
      employment_status: teacher.employment_status,
      status: teacher.status,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setEditing(true);
    try {
      const res = await updateTeacher(editingTeacher.id, editingTeacher.profile_id, {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim() || null,
        department: editForm.department.trim(),
        employment_status: editForm.employment_status,
        status: editForm.status,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Faculty details updated successfully.");
      setEditingTeacher(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update teacher";
      toast.error(msg);
    } finally {
      setEditing(false);
    }
  };

  const handleViewAssignments = async (teacher: Teacher) => {
    setViewingTeacher(teacher);
    setLoadingAssignments(true);
    try {
      const data = await fetchTeacherAssignments(teacher.id);
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Faculty & Teacher Management"
        subtitle="Manage academic staff profiles, departments, employment status, and subject allocations"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Teachers" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="mr-1.5 size-4" />
              Add Faculty Member
            </Button>
          </div>
        }
      >
        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by staff ID or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground">Department:</span>
            <div className="w-40">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  <SelectItem value="Sciences">Sciences</SelectItem>
                  <SelectItem value="Arts & Humanities">Arts & Humanities</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Languages">Languages</SelectItem>
                  <SelectItem value="Vocational & ICT">Vocational & ICT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Staff ID</th>
                  <th className="px-5 py-3.5">Faculty Name & Contact</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Employment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      <span>Loading faculty records...</span>
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Briefcase className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No faculty members found</p>
                      <p className="text-xs">
                        Click "Add Faculty Member" to register teaching staff.
                      </p>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-primary">
                        {teacher.staff_id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">
                          {teacher.profile?.full_name || "Faculty Member"}
                        </div>
                        <div className="text-muted-foreground">{teacher.profile?.email}</div>
                        {teacher.profile?.phone && (
                          <div className="text-[11px] text-muted-foreground">
                            {teacher.profile.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-800"
                        >
                          {teacher.department}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="secondary">
                          {teacher.employment_status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={teacher.status === "ACTIVE" ? "outline" : "secondary"}
                          className={
                            teacher.status === "ACTIVE" ? "border-emerald-300 text-emerald-700" : ""
                          }
                        >
                          {teacher.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAssignments(teacher)}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <BookOpen className="mr-1 size-3.5" />
                          Allocations
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(teacher)}
                          className="h-8 px-2 text-xs text-primary hover:text-primary"
                        >
                          <Edit2 className="mr-1 size-3.5" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Faculty Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Add Faculty Member</DialogTitle>
              <DialogDescription className="text-xs">
                Creates a faculty profile, assigns staff ID, and enables teaching portal access.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Dr. Samuel Okon"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="teacher@maxfem.edu.ng"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Phone Number</label>
                  <Input
                    placeholder="+234..."
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Staff ID *</label>
                  <Input
                    required
                    value={createForm.staff_id}
                    onChange={(e) => setCreateForm({ ...createForm, staff_id: e.target.value })}
                    className="text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Department</label>
                  <Select
                    value={createForm.department}
                    onValueChange={(val) => setCreateForm({ ...createForm, department: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sciences">Sciences</SelectItem>
                      <SelectItem value="Arts & Humanities">Arts & Humanities</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Languages">Languages</SelectItem>
                      <SelectItem value="Vocational & ICT">Vocational & ICT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Employment Status</label>
                <Select
                  value={createForm.employment_status}
                  onValueChange={(val) =>
                    setCreateForm({ ...createForm, employment_status: val as EmploymentStatus })
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                  </SelectContent>
                </Select>
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
                  {creating ? "Adding Faculty..." : "Add Faculty"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Faculty Modal */}
        <Dialog
          open={Boolean(editingTeacher)}
          onOpenChange={(open) => !open && setEditingTeacher(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Faculty Profile</DialogTitle>
              <DialogDescription className="text-xs">
                Update details for {editingTeacher?.profile?.full_name} ({editingTeacher?.staff_id}
                ).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Full Name</label>
                <Input
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Department</label>
                  <Input
                    required
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Employment</label>
                  <Select
                    value={editForm.employment_status}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, employment_status: val as EmploymentStatus })
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="LEAVE">On Leave</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Account Status</label>
                  <Select
                    value={editForm.status}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, status: val as AccountStatus })
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTeacher(null)}
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

        {/* View Allocations Modal */}
        <Dialog
          open={Boolean(viewingTeacher)}
          onOpenChange={(open) => !open && setViewingTeacher(null)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">
                Teaching Allocations — {viewingTeacher?.profile?.full_name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Classes and subjects assigned to staff ID: {viewingTeacher?.staff_id}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs">
              {loadingAssignments ? (
                <div className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto size-4 animate-spin mb-1 text-primary" />
                  <span>Loading allocations...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
                  <p>No classes or subjects assigned yet.</p>
                  <p className="text-[11px] mt-1">
                    Go to "Teacher Allocations" in the admin menu to assign classes and subjects.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-semibold text-foreground">
                          {a.subject?.name} ({a.subject?.code})
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          Class: {a.school_class?.name} • Session: {a.academic_session?.name} •{" "}
                          {a.term?.name}
                        </div>
                      </div>
                      {a.is_class_teacher && (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 bg-emerald-50"
                        >
                          Class Teacher
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setViewingTeacher(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
