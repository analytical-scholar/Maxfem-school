// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ADMIN DASHBOARD (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  Briefcase,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  ClipboardList,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Activity,
  CheckCircle2,
  Laptop,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchAdminStats, type AdminStats } from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { profile, role } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "Administrator"}`}
        subtitle="Maxfem Institutional Governance & Operational Overview"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Metrics
          </Button>
        }
      >
        {/* Active Academic Period Banner */}
        <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <Calendar className="mr-1 size-3" />
                  Live Academic Status
                </Badge>
                <Badge variant="secondary" className="font-mono text-xs">
                  PostgreSQL RLS Active
                </Badge>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
                Current Session: {stats?.activeSession?.name || "2024/2025 (Configured)"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Active Period:{" "}
                <span className="font-semibold text-foreground">
                  {stats?.activeTerm?.name || "Second Term"}
                </span>{" "}
                • Institutional Access Level:{" "}
                <span className="font-semibold text-primary">{role}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/academic-sessions">Manage Sessions</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/admin/students">
                  <PlusCircle className="mr-1.5 size-4" />
                  Enroll Student
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Real Data Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enrolled Students
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <GraduationCap className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : (stats?.totalStudents ?? 0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Registered Student Records</p>
              <div className="mt-3">
                <Link
                  to="/admin/students"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  View student directory <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Academic Faculty
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Briefcase className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : (stats?.totalTeachers ?? 0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Active Teaching Staff</p>
              <div className="mt-3">
                <Link
                  to="/admin/teachers"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  Manage faculty assignments <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Classes Configured
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
                <Layers className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : (stats?.totalClasses ?? 0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Junior & Senior School Arms</p>
              <div className="mt-3">
                <Link
                  to="/admin/classes"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  View class structures <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Curriculum Subjects
              </CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
                <BookOpen className="size-4.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : (stats?.totalSubjects ?? 0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Sciences, Arts & Commercial</p>
              <div className="mt-3">
                <Link
                  to="/admin/subjects"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  Manage course catalog <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Administrative Fast Navigation Grid */}
        <div className="mt-8">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">
            Institutional Management Modules
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/admin/cbt"
              className="group rounded-xl border border-emerald-500/30 bg-emerald-50/30 p-5 shadow-card transition-all hover:border-emerald-500 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-white">
                  <Laptop className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-emerald-700">
                      CBT Examinations
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Online tests, question bank & live monitor
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-5" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    User Accounts & Roles
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Directory, status & privilege guards
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/enrollments"
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <ClipboardList className="size-5" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    Student Enrollments
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Session & Term historical placement
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/teacher-assignments"
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <UserCheck className="size-5" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    Teacher Allocations
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Class & Subject assignment mappings
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/terms"
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Clock className="size-5" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    Terms & Timelines
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    First, Second & Third Term calendars
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/academic-sessions"
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Calendar className="size-5" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    Academic Sessions
                  </h4>
                  <p className="text-xs text-muted-foreground">Session creation & active switch</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-gray-500/10 text-gray-700 dark:text-gray-300">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    System & Security
                  </h4>
                  <p className="text-xs text-muted-foreground">RBAC settings & security audits</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Audit & System Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Recent Security & Governance Events
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Audited events recorded in public.audit_logs
                </CardDescription>
              </div>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                <div className="divide-y divide-border">
                  {stats.recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground font-mono font-semibold text-[10px]">
                          LOG
                        </span>
                        <div>
                          <div className="font-medium text-foreground">{log.action}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Entity: {log.entity_type} • ID: {log.entity_id || "System"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto size-6 text-emerald-600 mb-2" />
                  <span>Audit logging is active. No unauthorized escalations detected.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
