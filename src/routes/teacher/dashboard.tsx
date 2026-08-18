// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER DASHBOARD (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Layers,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  BookMarked,
  UserCheck,
  CheckCircle2,
  Laptop,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchTeacherPortalData, type TeacherDashboardData } from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/teacher/dashboard")({
  head: () => ({
    meta: [
      { title: "Teacher Workspace — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title={`Faculty Workspace: ${profile?.full_name || "Teacher"}`}
        subtitle="Manage your assigned classroom streams, course instruction, and student rosters"
        breadcrumbs={[{ label: "Teacher" }, { label: "Dashboard" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        {/* Academic Session & Staff Banner */}
        <div className="mb-8 rounded-2xl border border-emerald-300/40 bg-emerald-50/50 p-6 dark:bg-emerald-950/20 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                >
                  <BookMarked className="mr-1 size-3" />
                  Faculty Portal
                </Badge>
                <Badge variant="secondary" className="font-mono text-xs">
                  Staff ID: {data?.teacher?.staff_id || "MIS/TCH/STAFF"}
                </Badge>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
                Department: {data?.teacher?.department || "Academic Faculty"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Active Session:{" "}
                <span className="font-semibold text-foreground">
                  {data?.activeSession?.name || "2024/2025"}
                </span>{" "}
                • Period:{" "}
                <span className="font-semibold text-foreground">
                  {data?.activeTerm?.name || "Second Term"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link to="/teacher/cbt">
                  <Laptop className="mr-1.5 size-4" />
                  <span>CBT Examinations</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/teacher/classes">
                  <span>My Classes</span>
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Classes
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
                <Layers className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : data?.assignedClasses?.length || 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Class streams taught</p>
              <div className="mt-3">
                <Link
                  to="/teacher/classes"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  View class streams <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Teaching Subjects
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
                <BookOpen className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : data?.assignedSubjects?.length || 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Curriculum subjects allocated</p>
              <div className="mt-3">
                <Link
                  to="/teacher/subjects"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  View subject list <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Students Under Care
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <GraduationCap className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : data?.totalStudents || 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Enrolled in your classes</p>
              <div className="mt-3">
                <Link
                  to="/teacher/students"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  View student roster <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Courses / Teaching Schedule Card */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                My Course & Classroom Allocations
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Active subjects and grade levels assigned to your faculty schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                  <span>Loading course allocations...</span>
                </div>
              ) : data?.assignments && data.assignments.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {a.subject?.name}
                          </span>
                          <span className="font-mono text-xs text-primary font-bold">
                            ({a.subject?.code})
                          </span>
                          {a.is_class_teacher && (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                              Class Teacher
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Class: {a.school_class?.name} • Session: {a.academic_session?.name} •{" "}
                          {a.term?.name}
                        </div>
                      </div>
                      <Badge variant="outline" className="w-fit text-xs">
                        {a.subject?.department}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto size-6 text-muted-foreground/60 mb-2" />
                  <span>
                    No specific course allocations found. Please contact the Academic Admin to
                    assign classes.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
