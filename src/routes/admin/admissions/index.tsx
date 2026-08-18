// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ADMISSIONS MANAGEMENT DASHBOARD (PHASE 4)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  UserPlus,
  FileCheck,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Filter,
  GraduationCap,
  Layers,
  Calendar,
  Eye,
  Building,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchAdmissionsStats,
  fetchClasses,
  fetchAcademicSessions,
  createApplication,
  type AdmissionsStats,
  type SchoolClassWithCount,
} from "@/lib/school-service";
import type {
  AdmissionApplication,
  AcademicSession,
  Gender,
  ApplicationStatus,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/admin/admissions/")({
  head: () => ({
    meta: [
      { title: "Admissions Dashboard — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdmissionsDashboardPage,
});

function AdmissionsDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdmissionsStats | null>(null);
  const [classes, setClasses] = useState<SchoolClassWithCount[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Application Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    first_name: "",
    last_name: "",
    other_name: "",
    date_of_birth: "",
    gender: "MALE" as Gender,
    email: "",
    phone: "",
    address: "",
    guardian_name: "",
    guardian_relationship: "Parent",
    guardian_phone: "",
    guardian_email: "",
    previous_school: "",
    previous_class: "",
    desired_class_id: "",
    desired_academic_session_id: "",
    status: "SUBMITTED" as ApplicationStatus,
  });

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsData, classesData, sessionsData] = await Promise.all([
        fetchAdmissionsStats(),
        fetchClasses(),
        fetchAcademicSessions(),
      ]);

      setStats(statsData);
      setClasses(classesData);
      setSessions(sessionsData);

      // Pre-select active session if available
      const activeSession = sessionsData.find((s) => s.is_current);
      if (activeSession && !newAppForm.desired_academic_session_id) {
        setNewAppForm((prev) => ({
          ...prev,
          desired_academic_session_id: activeSession.id,
        }));
      }
      if (classesData.length > 0 && !newAppForm.desired_class_id) {
        setNewAppForm((prev) => ({
          ...prev,
          desired_class_id: classesData[0].id,
        }));
      }
    } catch (err) {
      console.error("Error loading admissions dashboard:", err);
      toast.error("Failed to load admissions dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newAppForm.first_name.trim() ||
      !newAppForm.last_name.trim() ||
      !newAppForm.date_of_birth ||
      !newAppForm.email.trim() ||
      !newAppForm.phone.trim() ||
      !newAppForm.guardian_name.trim() ||
      !newAppForm.guardian_phone.trim() ||
      !newAppForm.desired_class_id ||
      !newAppForm.desired_academic_session_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await createApplication({
        first_name: newAppForm.first_name,
        last_name: newAppForm.last_name,
        other_name: newAppForm.other_name,
        date_of_birth: newAppForm.date_of_birth,
        gender: newAppForm.gender,
        email: newAppForm.email,
        phone: newAppForm.phone,
        address: newAppForm.address,
        guardian_name: newAppForm.guardian_name,
        guardian_relationship: newAppForm.guardian_relationship,
        guardian_phone: newAppForm.guardian_phone,
        guardian_email: newAppForm.guardian_email,
        previous_school: newAppForm.previous_school,
        previous_class: newAppForm.previous_class,
        desired_class_id: newAppForm.desired_class_id,
        desired_academic_session_id: newAppForm.desired_academic_session_id,
        status: newAppForm.status,
      });

      if (res.success && res.data) {
        toast.success(
          `Application registered successfully! App No: ${res.data.application_number}`,
        );
        setShowNewModal(false);
        setNewAppForm({
          first_name: "",
          last_name: "",
          other_name: "",
          date_of_birth: "",
          gender: "MALE",
          email: "",
          phone: "",
          address: "",
          guardian_name: "",
          guardian_relationship: "Parent",
          guardian_phone: "",
          guardian_email: "",
          previous_school: "",
          previous_class: "",
          desired_class_id: classes[0]?.id || "",
          desired_academic_session_id:
            sessions.find((s) => s.is_current)?.id || sessions[0]?.id || "",
          status: "SUBMITTED",
        });
        loadData(true);
      } else {
        toast.error(res.error || "Failed to create application");
      }
    } catch (err) {
      toast.error("Unexpected error creating application");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium">
            Approved
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 font-medium">
            Under Review
          </Badge>
        );
      case "VERIFICATION_REQUIRED":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-medium">
            Verification Req.
          </Badge>
        );
      case "WAITLISTED":
        return (
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 font-medium">
            Waitlisted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 font-medium">
            Rejected
          </Badge>
        );
      case "WITHDRAWN":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Withdrawn
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            Draft
          </Badge>
        );
      case "SUBMITTED":
      default:
        return (
          <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 font-medium">
            Submitted
          </Badge>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Admissions Management"
        subtitle="End-to-end applicant tracking, document verification, decisions, and student enrollment"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Admissions" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowNewModal(true)}
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" />
              New Application
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Top KPI Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Applications */}
            <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Applications
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ClipboardList className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? "..." : (stats?.totalApplications ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across all academic sessions</p>
              </CardContent>
            </Card>

            {/* Pending & Under Review */}
            <Card className="border border-border/80 shadow-sm bg-card hover:border-blue-500/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Review Queue
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loading ? "..." : (stats?.submittedCount ?? 0) + (stats?.underReviewCount ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.submittedCount ?? 0} new, {stats?.underReviewCount ?? 0} in review
                </p>
              </CardContent>
            </Card>

            {/* Approved & Ready for Enrolment */}
            <Card className="border border-border/80 shadow-sm bg-card hover:border-emerald-500/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved Admissions
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {loading ? "..." : (stats?.approvedCount ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.convertedCount ?? 0} converted to enrolled students
                </p>
              </CardContent>
            </Card>

            {/* Verification Required / Waitlisted */}
            <Card className="border border-border/80 shadow-sm bg-card hover:border-amber-500/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Verification & Waitlist
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {loading
                    ? "..."
                    : (stats?.verificationRequiredCount ?? 0) + (stats?.waitlistedCount ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.verificationRequiredCount ?? 0} docs pending,{" "}
                  {stats?.waitlistedCount ?? 0} waitlisted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Admissions Applications Directory
                </h3>
                <p className="text-xs text-muted-foreground">
                  Access complete list of applicants, filter by status, review documents, and manage
                  decisions.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="default" size="sm" className="gap-2 shadow-sm">
                <Link to="/admin/admissions/applications">
                  Open Application Directory
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Two-Column Overview: Status Breakdown & Class Distribution */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Status Breakdown Pipeline */}
            <Card className="border border-border/80 shadow-sm lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Application Funnel</CardTitle>
                <CardDescription>
                  Current distribution of applications by lifecycle stage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>Submitted (Pending)</span>
                  </div>
                  <span className="font-semibold">{stats?.submittedCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Under Review</span>
                  </div>
                  <span className="font-semibold">{stats?.underReviewCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Verification Required</span>
                  </div>
                  <span className="font-semibold">{stats?.verificationRequiredCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Approved</span>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {stats?.approvedCount ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span>Waitlisted</span>
                  </div>
                  <span className="font-semibold">{stats?.waitlistedCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Rejected</span>
                  </div>
                  <span className="font-semibold text-rose-600">{stats?.rejectedCount ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Applications by Desired Class & Session */}
            <Card className="border border-border/80 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Demand by Grade / Class</CardTitle>
                <CardDescription>
                  Number of applications received for each target class level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Loading class distribution...
                  </div>
                ) : !stats?.classBreakdown || stats.classBreakdown.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    No class-specific application data recorded yet.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stats.classBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                            {item.className.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.className}</p>
                            <p className="text-xs text-muted-foreground">Target entry level</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-semibold px-2.5 py-0.5">
                          {item.count} {item.count === 1 ? "applicant" : "applicants"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications Queue */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-semibold">Recent Applications Queue</CardTitle>
                <CardDescription>
                  Latest candidate submissions awaiting review or decision
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link to="/admin/admissions/applications">
                  View Full Directory
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading recent applications...
                </div>
              ) : !stats?.recentApplications || stats.recentApplications.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground border-t">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  No admission applications submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-t">
                      <tr>
                        <th className="px-4 py-3 font-medium">App Number</th>
                        <th className="px-4 py-3 font-medium">Applicant Name</th>
                        <th className="px-4 py-3 font-medium">Target Class</th>
                        <th className="px-4 py-3 font-medium">Guardian</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Submitted Date</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stats.recentApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-medium text-foreground">
                            {app.application_number}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-foreground">
                              {app.first_name} {app.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{app.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {app.desired_class?.name || "Unassigned"}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            <div>{app.guardian_name}</div>
                            <div>{app.guardian_phone}</div>
                          </td>
                          <td className="px-4 py-3.5">{getStatusBadge(app.status)}</td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {app.submission_date
                              ? new Date(app.submission_date).toLocaleDateString()
                              : new Date(app.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                            >
                              <Link
                                to="/admin/admissions/applications"
                                search={{ selectedId: app.id }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Review
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Walk-in New Application Registration Modal */}
        <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Register New Admission Application
              </DialogTitle>
              <DialogDescription>
                Enter candidate and guardian details to log a walk-in or phone admission
                application.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateApplication} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-xs font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    value={newAppForm.first_name}
                    onChange={(e) => setNewAppForm({ ...newAppForm, first_name: e.target.value })}
                    placeholder="e.g. Samuel"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    value={newAppForm.last_name}
                    onChange={(e) => setNewAppForm({ ...newAppForm, last_name: e.target.value })}
                    placeholder="e.g. Adeleke"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="other_name" className="text-xs font-medium">
                    Middle / Other Name
                  </Label>
                  <Input
                    id="other_name"
                    value={newAppForm.other_name}
                    onChange={(e) => setNewAppForm({ ...newAppForm, other_name: e.target.value })}
                    placeholder="e.g. Oluwaseun"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date_of_birth" className="text-xs font-medium">
                    Date of Birth *
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={newAppForm.date_of_birth}
                    onChange={(e) =>
                      setNewAppForm({ ...newAppForm, date_of_birth: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-xs font-medium">
                    Gender *
                  </Label>
                  <Select
                    value={newAppForm.gender}
                    onValueChange={(val: Gender) => setNewAppForm({ ...newAppForm, gender: val })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Applicant / Parent Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAppForm.email}
                    onChange={(e) => setNewAppForm({ ...newAppForm, email: e.target.value })}
                    placeholder="parent@example.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium">
                    Contact Phone *
                  </Label>
                  <Input
                    id="phone"
                    value={newAppForm.phone}
                    onChange={(e) => setNewAppForm({ ...newAppForm, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    required
                  />
                </div>
              </div>

              {/* Target Class & Session */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg border border-border/60">
                <div className="space-y-1.5">
                  <Label htmlFor="desired_class_id" className="text-xs font-medium">
                    Desired Entry Class *
                  </Label>
                  <Select
                    value={newAppForm.desired_class_id}
                    onValueChange={(val) => setNewAppForm({ ...newAppForm, desired_class_id: val })}
                  >
                    <SelectTrigger id="desired_class_id">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.arm ? `(${cls.arm})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desired_academic_session_id" className="text-xs font-medium">
                    Target Academic Session *
                  </Label>
                  <Select
                    value={newAppForm.desired_academic_session_id}
                    onValueChange={(val) =>
                      setNewAppForm({ ...newAppForm, desired_academic_session_id: val })
                    }
                  >
                    <SelectTrigger id="desired_academic_session_id">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((ses) => (
                        <SelectItem key={ses.id} value={ses.id}>
                          {ses.name} {ses.is_current ? "(Current Session)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guardian_name" className="text-xs font-medium">
                    Guardian Name *
                  </Label>
                  <Input
                    id="guardian_name"
                    value={newAppForm.guardian_name}
                    onChange={(e) =>
                      setNewAppForm({ ...newAppForm, guardian_name: e.target.value })
                    }
                    placeholder="Mr. Adeleke"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guardian_relationship" className="text-xs font-medium">
                    Relationship *
                  </Label>
                  <Input
                    id="guardian_relationship"
                    value={newAppForm.guardian_relationship}
                    onChange={(e) =>
                      setNewAppForm({ ...newAppForm, guardian_relationship: e.target.value })
                    }
                    placeholder="Father / Mother / Guardian"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guardian_phone" className="text-xs font-medium">
                    Guardian Phone *
                  </Label>
                  <Input
                    id="guardian_phone"
                    value={newAppForm.guardian_phone}
                    onChange={(e) =>
                      setNewAppForm({ ...newAppForm, guardian_phone: e.target.value })
                    }
                    placeholder="+234 800 000 0000"
                    required
                  />
                </div>
              </div>

              {/* Previous School Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="previous_school" className="text-xs font-medium">
                    Previous School (if applicable)
                  </Label>
                  <Input
                    id="previous_school"
                    value={newAppForm.previous_school}
                    onChange={(e) =>
                      setNewAppForm({ ...newAppForm, previous_school: e.target.value })
                    }
                    placeholder="e.g. St. Jude Nursery & Primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="previous_class" className="text-xs font-medium">
                    Previous Class Attained
                  </Label>
                  <Input
                    id="previous_class"
                    value={newAppForm.previous_class}
                    onChange={(e) =>
                      setNewAppForm({ ...newAppForm, previous_class: e.target.value })
                    }
                    placeholder="e.g. Primary 5"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Registering..." : "Submit Application"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
