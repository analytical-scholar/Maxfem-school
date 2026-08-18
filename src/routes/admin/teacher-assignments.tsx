// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER ASSIGNMENTS (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserCheck, Plus, RefreshCw, Trash2, BookOpen, Layers, Calendar } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchTeacherAssignments,
  createTeacherAssignment,
  deleteTeacherAssignment,
  fetchTeachers,
  fetchSubjects,
  fetchClasses,
  fetchAcademicSessions,
  fetchTerms,
  type SchoolClassWithCount,
} from "@/lib/school-service";
import type { TeacherAssignment, Teacher, Subject, AcademicSession, Term } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/admin/teacher-assignments")({
  head: () => ({
    meta: [
      { title: "Teacher Allocations — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTeacherAssignmentsPage,
});

function AdminTeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClassWithCount[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [teacherFilter, setTeacherFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    teacher_id: "",
    subject_id: "",
    class_id: "",
    academic_session_id: "",
    term_id: "",
    is_class_teacher: false,
  });
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsData, teachersData, subjectsData, classesData, sessionsData, termsData] =
        await Promise.all([
          fetchTeacherAssignments(
            teacherFilter === "ALL" ? undefined : teacherFilter,
            classFilter === "ALL" ? undefined : classFilter,
          ),
          fetchTeachers(),
          fetchSubjects(),
          fetchClasses(),
          fetchAcademicSessions(),
          fetchTerms(),
        ]);

      setAssignments(assignmentsData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setClasses(classesData);
      setSessions(sessionsData);
      setTerms(termsData);

      const curSession = sessionsData.find((s) => s.is_current) || sessionsData[0];
      const curTerm = termsData.find((t) => t.is_current) || termsData[0];
      if (curSession && !createForm.academic_session_id) {
        setCreateForm((prev) => ({ ...prev, academic_session_id: curSession.id }));
      }
      if (curTerm && !createForm.term_id) {
        setCreateForm((prev) => ({ ...prev, term_id: curTerm.id }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load teacher allocations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherFilter, classFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !createForm.teacher_id ||
      !createForm.subject_id ||
      !createForm.class_id ||
      !createForm.academic_session_id ||
      !createForm.term_id
    ) {
      toast.error("Please fill in all assignment fields.");
      return;
    }

    setCreating(true);
    try {
      const res = await createTeacherAssignment({
        teacher_id: createForm.teacher_id,
        subject_id: createForm.subject_id,
        class_id: createForm.class_id,
        academic_session_id: createForm.academic_session_id,
        term_id: createForm.term_id,
        is_class_teacher: createForm.is_class_teacher,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Teacher allocation created successfully.");
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to allocate teacher";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this teacher assignment?")) return;

    try {
      const res = await deleteTeacherAssignment(id);
      if (!res.success) throw new Error(res.error);
      toast.success("Assignment removed.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete assignment";
      toast.error(msg);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Teacher & Subject Allocations"
        subtitle="Map academic faculty to specific curriculum subjects, classes, and class teacher duties"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Allocations" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateForm((prev) => ({
                  ...prev,
                  teacher_id: teachers[0]?.id || "",
                  subject_id: subjects[0]?.id || "",
                  class_id: classes[0]?.id || "",
                }));
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" />
              New Allocation
            </Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="w-52">
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Faculty Members</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.profile?.full_name} ({t.staff_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-44">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Allocations Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Faculty Member</th>
                  <th className="px-5 py-3.5">Assigned Subject</th>
                  <th className="px-5 py-3.5">Classroom</th>
                  <th className="px-5 py-3.5">Session / Term</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      <span>Loading teacher allocations...</span>
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <UserCheck className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No allocations found</p>
                      <p className="text-xs">
                        Click "New Allocation" to map a teacher to a subject and class.
                      </p>
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">
                          {a.teacher?.profile?.full_name}
                        </div>
                        <div className="font-mono text-[11px] text-primary">
                          {a.teacher?.staff_id}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{a.subject?.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {a.subject?.code}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {a.school_class?.name}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <div>{a.academic_session?.name}</div>
                        <div className="text-[11px]">{a.term?.name}</div>
                      </td>
                      <td className="px-5 py-4">
                        {a.is_class_teacher ? (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">
                            Class Teacher
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Subject Teacher</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(a.id)}
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Allocation Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">New Teacher Allocation</DialogTitle>
              <DialogDescription className="text-xs">
                Assign a faculty member to teach a subject in a specific class.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Faculty Member *</label>
                <Select
                  value={createForm.teacher_id}
                  onValueChange={(val) => setCreateForm({ ...createForm, teacher_id: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choose teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.profile?.full_name} ({t.staff_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Subject *</label>
                  <Select
                    value={createForm.subject_id}
                    onValueChange={(val) => setCreateForm({ ...createForm, subject_id: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Choose subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Class *</label>
                  <Select
                    value={createForm.class_id}
                    onValueChange={(val) => setCreateForm({ ...createForm, class_id: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Choose class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Academic Session *
                  </label>
                  <Select
                    value={createForm.academic_session_id}
                    onValueChange={(val) =>
                      setCreateForm({ ...createForm, academic_session_id: val })
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Term *</label>
                  <Select
                    value={createForm.term_id}
                    onValueChange={(val) => setCreateForm({ ...createForm, term_id: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Term" />
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_class_teacher"
                  checked={createForm.is_class_teacher}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, is_class_teacher: e.target.checked })
                  }
                  className="size-4 rounded border-border"
                />
                <label
                  htmlFor="is_class_teacher"
                  className="text-xs text-foreground cursor-pointer"
                >
                  Appoint as Primary Class Teacher for this class
                </label>
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
                  {creating ? "Allocating..." : "Allocate Teacher"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
