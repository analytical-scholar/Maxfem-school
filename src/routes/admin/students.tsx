// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT DIRECTORY & REGISTRATION (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  GraduationCap,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  fetchClasses,
  fetchAcademicSessions,
  fetchTerms,
  createStudentEnrollment,
  type SchoolClassWithCount,
} from "@/lib/school-service";
import type {
  Student,
  Gender,
  AdmissionStatus,
  AccountStatus,
  AcademicSession,
  Term,
} from "@/types/database";
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

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title: "Students Directory — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminStudentsPage,
});

function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClassWithCount[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Student Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    other_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "MALE" as Gender,
    admission_number: "",
    admission_status: "ADMITTED" as AdmissionStatus,
    initial_class_id: "",
    initial_session_id: "",
    initial_term_id: "",
  });
  const [creating, setCreating] = useState(false);

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    other_name: "",
    phone: "",
    date_of_birth: "",
    gender: "MALE" as Gender,
    admission_status: "ADMITTED" as AdmissionStatus,
    status: "ACTIVE" as AccountStatus,
  });
  const [editing, setEditing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsData, classesData, sessionsData, termsData] = await Promise.all([
        fetchStudents(search, statusFilter === "ALL" ? undefined : (statusFilter as AccountStatus)),
        fetchClasses(),
        fetchAcademicSessions(),
        fetchTerms(),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
      setSessions(sessionsData);
      setTerms(termsData);

      // Pre-fill initial session/term in create form
      const currentSession = sessionsData.find((s) => s.is_current) || sessionsData[0];
      const currentTerm = termsData.find((t) => t.is_current) || termsData[0];
      if (currentSession)
        setCreateForm((prev) => ({ ...prev, initial_session_id: currentSession.id }));
      if (currentTerm) setCreateForm((prev) => ({ ...prev, initial_term_id: currentTerm.id }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load students directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const autoAdmissionNumber = `MIS/${year}/${rand}`;

    setCreateForm((prev) => ({
      ...prev,
      first_name: "",
      last_name: "",
      other_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      gender: "MALE",
      admission_number: autoAdmissionNumber,
      admission_status: "ADMITTED",
      initial_class_id: classes[0]?.id || "",
    }));
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.first_name.trim() || !createForm.last_name.trim() || !createForm.email.trim()) {
      toast.error("Please enter first name, last name, and student email.");
      return;
    }

    setCreating(true);
    try {
      const res = await createStudent({
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        other_name: createForm.other_name.trim() || undefined,
        email: createForm.email.trim().toLowerCase(),
        phone: createForm.phone.trim() || undefined,
        date_of_birth: createForm.date_of_birth || undefined,
        gender: createForm.gender,
        admission_number: createForm.admission_number.trim(),
        admission_status: createForm.admission_status,
      });

      if (!res.success || !res.data) throw new Error(res.error || "Failed to create student");

      // If initial class is selected, create enrollment record
      if (
        createForm.initial_class_id &&
        createForm.initial_session_id &&
        createForm.initial_term_id
      ) {
        await createStudentEnrollment({
          student_id: res.data.id,
          class_id: createForm.initial_class_id,
          academic_session_id: createForm.initial_session_id,
          term_id: createForm.initial_term_id,
          status: "ACTIVE",
        });
      }

      toast.success(
        `Student ${createForm.first_name} ${createForm.last_name} enrolled successfully.`,
      );
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register student";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      first_name: student.first_name,
      last_name: student.last_name,
      other_name: student.other_name || "",
      phone: student.profile?.phone || "",
      date_of_birth: student.date_of_birth || "",
      gender: student.gender || "MALE",
      admission_status: student.admission_status,
      status: student.status,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setEditing(true);
    try {
      const res = await updateStudent(editingStudent.id, editingStudent.profile_id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        other_name: editForm.other_name.trim() || null,
        phone: editForm.phone.trim() || null,
        date_of_birth: editForm.date_of_birth || null,
        gender: editForm.gender,
        admission_status: editForm.admission_status,
        status: editForm.status,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Student details updated successfully.");
      setEditingStudent(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update student";
      toast.error(msg);
    } finally {
      setEditing(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Student Directory & Registration"
        subtitle="Manage student admissions, admission numbers, profiles, and classroom assignments"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Students" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="mr-1.5 size-4" />
              Register New Student
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
                placeholder="Search by student name or admission number..."
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
            <span className="text-xs text-muted-foreground">Status:</span>
            <div className="w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Admission No.</th>
                  <th className="px-5 py-3.5">Full Name & Contact</th>
                  <th className="px-5 py-3.5">Gender / DOB</th>
                  <th className="px-5 py-3.5">Admission Status</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      <span>Loading student records...</span>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <GraduationCap className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No students found</p>
                      <p className="text-xs">Click "Register New Student" to enroll a student.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-primary">
                        {student.admission_number}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">
                          {student.first_name} {student.other_name ? `${student.other_name} ` : ""}
                          {student.last_name}
                        </div>
                        <div className="text-muted-foreground">{student.profile?.email}</div>
                        {student.profile?.phone && (
                          <div className="text-[11px] text-muted-foreground">
                            {student.profile.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <div>{student.gender || "—"}</div>
                        {student.date_of_birth && (
                          <div className="text-[11px]">DOB: {student.date_of_birth}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={
                            student.admission_status === "ADMITTED"
                              ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                              : "border-amber-300 text-amber-700 bg-amber-50"
                          }
                        >
                          {student.admission_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={student.status === "ACTIVE" ? "outline" : "secondary"}
                          className={
                            student.status === "ACTIVE" ? "border-emerald-300 text-emerald-700" : ""
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(student)}
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                        >
                          <Edit2 className="mr-1 size-3.5" />
                          Edit Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Register New Student Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display">Register New Student</DialogTitle>
              <DialogDescription className="text-xs">
                Creates the student profile, assigns a unique admission number, and optionally
                places in a class.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">First Name *</label>
                  <Input
                    required
                    placeholder="e.g. David"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Last Name *</label>
                  <Input
                    required
                    placeholder="e.g. Adebayo"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Other Name (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Oluwaseun"
                    value={createForm.other_name}
                    onChange={(e) => setCreateForm({ ...createForm, other_name: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Admission Number *
                  </label>
                  <Input
                    required
                    value={createForm.admission_number}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, admission_number: e.target.value })
                    }
                    className="text-xs font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Student Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="student@maxfem.edu.ng"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Parent / Guardian Phone
                  </label>
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
                  <label className="font-medium text-foreground block mb-1">Gender</label>
                  <Select
                    value={createForm.gender}
                    onValueChange={(val) => setCreateForm({ ...createForm, gender: val as Gender })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">MALE</SelectItem>
                      <SelectItem value="FEMALE">FEMALE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    value={createForm.date_of_birth}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, date_of_birth: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Class Placement */}
              <div className="border-t border-border pt-3">
                <div className="font-semibold text-foreground mb-2">
                  Classroom Placement (Optional)
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Class Arm
                    </label>
                    <Select
                      value={createForm.initial_class_id}
                      onValueChange={(val) =>
                        setCreateForm({ ...createForm, initial_class_id: val })
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} {c.arm ? `(${c.arm})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Academic Session
                    </label>
                    <Select
                      value={createForm.initial_session_id}
                      onValueChange={(val) =>
                        setCreateForm({ ...createForm, initial_session_id: val })
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.is_current ? "(Current)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Term</label>
                    <Select
                      value={createForm.initial_term_id}
                      onValueChange={(val) =>
                        setCreateForm({ ...createForm, initial_term_id: val })
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Term" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  {creating ? "Enrolling Student..." : "Enroll Student"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Student Modal */}
        <Dialog
          open={Boolean(editingStudent)}
          onOpenChange={(open) => !open && setEditingStudent(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Student Profile</DialogTitle>
              <DialogDescription className="text-xs">
                Update personal details for {editingStudent?.first_name} {editingStudent?.last_name}{" "}
                ({editingStudent?.admission_number}).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">First Name</label>
                  <Input
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Last Name</label>
                  <Input
                    required
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Other Name</label>
                  <Input
                    value={editForm.other_name}
                    onChange={(e) => setEditForm({ ...editForm, other_name: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Gender</label>
                  <Select
                    value={editForm.gender}
                    onValueChange={(val) => setEditForm({ ...editForm, gender: val as Gender })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">MALE</SelectItem>
                      <SelectItem value="FEMALE">FEMALE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Admission Status</label>
                  <Select
                    value={editForm.admission_status}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, admission_status: val as AdmissionStatus })
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMITTED">ADMITTED</SelectItem>
                      <SelectItem value="APPLIED">APPLIED</SelectItem>
                      <SelectItem value="ENROLLED">ENROLLED</SelectItem>
                      <SelectItem value="WITHDRAWN">WITHDRAWN</SelectItem>
                      <SelectItem value="GRADUATED">GRADUATED</SelectItem>
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
                  onClick={() => setEditingStudent(null)}
                  disabled={editing}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editing}>
                  {editing ? "Saving Changes..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
