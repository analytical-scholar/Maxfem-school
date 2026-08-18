// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT ENROLLMENT MANAGEMENT (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Filter,
  GraduationCap,
  Layers,
  Calendar,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchStudentEnrollments,
  createStudentEnrollment,
  fetchStudents,
  fetchClasses,
  fetchAcademicSessions,
  fetchTerms,
  type SchoolClassWithCount,
} from "@/lib/school-service";
import type {
  StudentEnrollment,
  Student,
  AcademicSession,
  Term,
  EnrollmentStatus,
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

export const Route = createFileRoute("/admin/enrollments")({
  head: () => ({
    meta: [
      { title: "Student Enrollments — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEnrollmentsPage,
});

function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClassWithCount[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [termFilter, setTermFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    student_id: "",
    class_id: "",
    academic_session_id: "",
    term_id: "",
    status: "ACTIVE" as EnrollmentStatus,
  });
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enrollmentsData, studentsData, classesData, sessionsData, termsData] =
        await Promise.all([
          fetchStudentEnrollments(
            classFilter === "ALL" ? undefined : classFilter,
            sessionFilter === "ALL" ? undefined : sessionFilter,
            termFilter === "ALL" ? undefined : termFilter,
          ),
          fetchStudents(),
          fetchClasses(),
          fetchAcademicSessions(),
          fetchTerms(),
        ]);

      setEnrollments(enrollmentsData);
      setStudents(studentsData);
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
      toast.error("Failed to load enrollment records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classFilter, sessionFilter, termFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !createForm.student_id ||
      !createForm.class_id ||
      !createForm.academic_session_id ||
      !createForm.term_id
    ) {
      toast.error("Please fill in all enrollment fields.");
      return;
    }

    setCreating(true);
    try {
      const res = await createStudentEnrollment({
        student_id: createForm.student_id,
        class_id: createForm.class_id,
        academic_session_id: createForm.academic_session_id,
        term_id: createForm.term_id,
        status: createForm.status,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Student enrollment record created successfully.");
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record enrollment";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const studentName = `${e.student?.first_name} ${e.student?.last_name}`.toLowerCase();
    const adm = (e.student?.admission_number || "").toLowerCase();
    return studentName.includes(s) || adm.includes(s);
  });

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Student Classroom Enrollments"
        subtitle="Manage student class allocations, academic session placements, and term promotions"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Enrollments" }]}
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
                  student_id: students[0]?.id || "",
                  class_id: classes[0]?.id || "",
                }));
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" />
              Enroll Student
            </Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by student name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="w-40">
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

          <div className="w-40">
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Terms</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Admission No.</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Enrolled Class</th>
                  <th className="px-5 py-3.5">Academic Session</th>
                  <th className="px-5 py-3.5">Term</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      <span>Loading enrollment records...</span>
                    </td>
                  </tr>
                ) : filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <ClipboardList className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No enrollment records found</p>
                      <p className="text-xs">
                        Click "Enroll Student" to assign a student to a class and session.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-primary">
                        {enr.student?.admission_number || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">
                          {enr.student?.first_name} {enr.student?.last_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {enr.student?.profile?.email}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {enr.school_class?.name}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {enr.academic_session?.name}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{enr.term?.name}</td>
                      <td className="px-5 py-4 text-right">
                        <Badge
                          variant="outline"
                          className={
                            enr.status === "ACTIVE"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                              : "border-border text-muted-foreground"
                          }
                        >
                          {enr.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enroll Student Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">New Student Enrollment</DialogTitle>
              <DialogDescription className="text-xs">
                Enroll an admitted student into a specific class, academic session, and term.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Select Student *</label>
                <Select
                  value={createForm.student_id}
                  onValueChange={(val) => setCreateForm({ ...createForm, student_id: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choose student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.admission_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Classroom Arm *</label>
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
                        {c.name} {c.arm ? `(${c.arm})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div>
                <label className="font-medium text-foreground block mb-1">Enrollment Status</label>
                <Select
                  value={createForm.status}
                  onValueChange={(val) =>
                    setCreateForm({ ...createForm, status: val as EnrollmentStatus })
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="WITHDRAWN">WITHDRAWN</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
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
                  {creating ? "Enrolling..." : "Enroll Student"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
