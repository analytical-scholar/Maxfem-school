// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT DASHBOARD (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  User,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Award,
  Laptop,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchStudentPortalData, type StudentDashboardData } from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Portal — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetchStudentPortalData(profile.id);
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
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title={`Student Portal: ${data?.student?.first_name || profile?.full_name || "Student"}`}
        subtitle="Access your academic enrollment, classroom stream, enrolled subjects, and term progress"
        breadcrumbs={[{ label: "Student" }, { label: "Dashboard" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        {/* Student Identification Banner */}
        <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <GraduationCap className="mr-1 size-3.5" />
                  Maxfem Scholar
                </Badge>
                <Badge variant="secondary" className="font-mono text-xs">
                  Adm No: {data?.student?.admission_number || "MIS/2024/STD"}
                </Badge>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
                Class: {data?.currentEnrollment?.school_class?.name || "Enrolled Class"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Session:{" "}
                <span className="font-semibold text-foreground">
                  {data?.activeSession?.name || "2024/2025"}
                </span>{" "}
                • Term:{" "}
                <span className="font-semibold text-foreground">
                  {data?.activeTerm?.name || "Second Term"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link to="/student/exams">
                  <Laptop className="mr-1.5 size-4" />
                  <span>CBT Examinations</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/student/profile">
                  <span>Student Bio</span>
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Class
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
                <Layers className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : data?.currentEnrollment?.school_class?.name || "JSS 1 Gold"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Grade {data?.currentEnrollment?.school_class?.grade_level || 7}
              </p>
              <div className="mt-3">
                <Link
                  to="/student/classes"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  View class details <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enrolled Subjects
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
                <BookOpen className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : data?.subjects?.length || 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Curriculum subjects</p>
              <div className="mt-3">
                <Link
                  to="/student/subjects"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  View subject syllabus <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Academic Standing
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Award className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-emerald-600">
                {data?.student?.status || "ACTIVE"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Admission: {data?.student?.admission_status || "REGULAR"}
              </p>
              <div className="mt-3">
                <span className="text-xs font-medium text-muted-foreground">In Good Standing</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subjects & Teachers Roster */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Class Subjects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">
                  Curriculum Subjects
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                  <Link to="/student/subjects">View All</Link>
                </Button>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Courses registered for your current grade level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                  <span>Loading subjects...</span>
                </div>
              ) : data?.subjects && data.subjects.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.subjects.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="font-medium text-foreground text-xs">{sub.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {sub.code}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {sub.department}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No subjects registered.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Academic Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Scholar Profile Summary
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Official institutional records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-semibold text-foreground">
                  {data?.student?.first_name} {data?.student?.other_name || ""}{" "}
                  {data?.student?.last_name}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Admission Number:</span>
                <span className="font-mono font-bold text-primary">
                  {data?.student?.admission_number}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Guardian Contact:</span>
                <span className="font-semibold text-foreground">
                  {data?.student?.guardian_name || "—"} ({data?.student?.guardian_phone || "—"})
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Enrollment Date:</span>
                <span className="text-foreground">
                  {data?.student?.created_at?.slice(0, 10) || "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
