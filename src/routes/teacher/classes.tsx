// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER CLASSES (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Users, RefreshCw, GraduationCap, BookOpen } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchTeacherPortalData,
  fetchStudentEnrollments,
  type TeacherDashboardData,
} from "@/lib/school-service";
import type { StudentEnrollment, SchoolClass } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({
    meta: [{ title: "My Classes — Maxfem Faculty Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: TeacherClassesPage,
});

function TeacherClassesPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Roster Modal
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetchTeacherPortalData(profile.id);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const handleOpenRoster = async (cls: SchoolClass) => {
    setSelectedClass(cls);
    setLoadingRoster(true);
    try {
      const res = await fetchStudentEnrollments(cls.id);
      setEnrollments(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoster(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title="My Assigned Classes"
        subtitle="Review classroom streams where you provide subject instruction or act as class teacher"
        breadcrumbs={[{ label: "Teacher", to: "/teacher/dashboard" }, { label: "My Classes" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
              <span>Loading assigned classes...</span>
            </div>
          ) : !data?.assignedClasses || data.assignedClasses.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-card">
              <Layers className="mx-auto size-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No classes assigned</p>
              <p className="text-xs">
                Your account is active. Please ask the academic administration office to map your
                teaching allocations.
              </p>
            </div>
          ) : (
            data.assignedClasses.map((cls) => (
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
                      Grade {cls.grade_level}
                    </Badge>
                    {cls.arm && <Badge variant="secondary">Arm {cls.arm}</Badge>}
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                    {cls.name}
                  </h3>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRoster(cls)}
                    className="w-full text-xs"
                  >
                    <Users className="mr-1.5 size-3.5" />
                    View Enrolled Students
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Student Roster Modal */}
        <Dialog
          open={Boolean(selectedClass)}
          onOpenChange={(open) => !open && setSelectedClass(null)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">
                Class Roster — {selectedClass?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                List of students enrolled in {selectedClass?.name} ({enrollments.length} students)
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs">
              {loadingRoster ? (
                <div className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto size-4 animate-spin mb-1 text-primary" />
                  <span>Loading roster...</span>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
                  <p>No active student enrollments for this class.</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-lg border border-border">
                  {enrollments.map((enr) => (
                    <div key={enr.id} className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-semibold text-foreground">
                          {enr.student?.first_name} {enr.student?.last_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Admission:{" "}
                          <span className="font-mono">{enr.student?.admission_number}</span>
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
              <Button size="sm" onClick={() => setSelectedClass(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
