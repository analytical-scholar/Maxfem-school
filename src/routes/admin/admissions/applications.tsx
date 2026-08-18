// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ADMISSIONS APPLICATION DIRECTORY (PHASE 4)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  FileCheck,
  GraduationCap,
  Layers,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  Upload,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Building,
  Check,
  X,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchApplications,
  fetchApplicationById,
  fetchClasses,
  fetchAcademicSessions,
  fetchTerms,
  updateApplicationStatus,
  addApplicationReviewNote,
  verifyApplicationDocument,
  uploadApplicationDocument,
  convertApplicationToStudent,
  type SchoolClassWithCount,
} from "@/lib/school-service";
import type {
  AdmissionApplication,
  ApplicationStatus,
  AcademicSession,
  Term,
  AdmissionDocType,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/admissions/applications")({
  head: () => ({
    meta: [
      { title: "Application Directory — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      selectedId: (search.selectedId as string) || undefined,
      status: (search.status as ApplicationStatus | "ALL") || "ALL",
    };
  },
  component: ApplicationsDirectoryPage,
});

function ApplicationsDirectoryPage() {
  const searchParams = useSearch({ from: "/admin/admissions/applications" });
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [classes, setClasses] = useState<SchoolClassWithCount[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">(
    searchParams.status || "ALL",
  );
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [sessionFilter, setSessionFilter] = useState<string>("ALL");

  // Detailed Review Modal
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Actions state
  const [newNote, setNewNote] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [decisionReason, setDecisionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Conversion state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [converting, setConverting] = useState(false);

  // Document Upload
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<AdmissionDocType>("BIRTH_CERTIFICATE");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [appsData, classesData, sessionsData, termsData] = await Promise.all([
        fetchApplications({
          search: searchQuery,
          statusFilter,
          classFilter,
          sessionFilter,
        }),
        fetchClasses(),
        fetchAcademicSessions(),
        fetchTerms(),
      ]);

      setApplications(appsData);
      setClasses(classesData);
      setSessions(sessionsData);
      setTerms(termsData);

      // If URL param selectedId is present, auto-open that application
      if (searchParams.selectedId && !selectedApp) {
        const found = appsData.find((a) => a.id === searchParams.selectedId);
        if (found) {
          openApplicationDetail(found.id);
        }
      }
    } catch (err) {
      console.error("Error loading applications:", err);
      toast.error("Failed to load applications directory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, classFilter, sessionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openApplicationDetail = async (id: string) => {
    setLoadingDetail(true);
    setShowReviewModal(true);
    try {
      const fullApp = await fetchApplicationById(id);
      if (fullApp) {
        setSelectedApp(fullApp);
        // Pre-select term for conversion
        const sessionTerms = terms.filter(
          (t) => t.academic_session_id === fullApp.desired_academic_session_id,
        );
        if (sessionTerms.length > 0) {
          setSelectedTermId(sessionTerms[0].id);
        }
      }
    } catch (err) {
      toast.error("Failed to load application details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshCurrentApplication = async () => {
    if (!selectedApp) return;
    try {
      const updated = await fetchApplicationById(selectedApp.id);
      if (updated) setSelectedApp(updated);
      loadData(true);
    } catch (err) {
      console.error("Error refreshing detail:", err);
    }
  };

  // Status transitions
  const handleStatusChange = async (newStatus: ApplicationStatus, reason?: string) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await updateApplicationStatus(selectedApp.id, newStatus, reason);
      if (res.success) {
        toast.success(`Application status updated to ${newStatus}`);
        if (showRejectModal) setShowRejectModal(false);
        refreshCurrentApplication();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch (err) {
      toast.error("Unexpected error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  // Review Notes
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await addApplicationReviewNote(selectedApp.id, newNote, isInternalNote);
      if (res.success) {
        toast.success("Review note recorded");
        setNewNote("");
        refreshCurrentApplication();
      } else {
        toast.error(res.error || "Failed to add review note");
      }
    } catch (err) {
      toast.error("Unexpected error adding note");
    } finally {
      setSubmittingNote(false);
    }
  };

  // Verify Document
  const handleToggleDocVerification = async (docId: string, currentStatus: boolean) => {
    try {
      const res = await verifyApplicationDocument(docId, !currentStatus);
      if (res.success) {
        toast.success(!currentStatus ? "Document marked as VERIFIED" : "Document unverified");
        refreshCurrentApplication();
      } else {
        toast.error(res.error || "Failed to update document verification status");
      }
    } catch (err) {
      toast.error("Error updating document status");
    }
  };

  // Upload Document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !uploadFile) {
      toast.error("Please choose a file to upload");
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await uploadApplicationDocument(selectedApp.id, uploadDocType, uploadFile);
      if (res.success) {
        toast.success("Document uploaded successfully");
        setShowDocUploadModal(false);
        setUploadFile(null);
        refreshCurrentApplication();
      } else {
        toast.error(res.error || "Failed to upload document");
      }
    } catch (err) {
      toast.error("Unexpected error uploading document");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Convert to Student
  const handleConvertStudent = async () => {
    if (!selectedApp) return;
    setConverting(true);
    try {
      const res = await convertApplicationToStudent(selectedApp.id, {
        term_id: selectedTermId || undefined,
      });

      if (res.success) {
        toast.success(`Success! Student record created with Admission No: ${res.admissionNumber}`);
        setShowConvertModal(false);
        refreshCurrentApplication();
      } else {
        toast.error(res.error || "Failed to convert application to student");
      }
    } catch (err) {
      toast.error("Unexpected error converting applicant to student");
    } finally {
      setConverting(false);
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
        title="Application Directory"
        subtitle="Review prospective candidate applications, verify credentials, and manage admission decisions"
        breadcrumbs={[
          { label: "Admin", to: "/admin/dashboard" },
          { label: "Admissions", to: "/admin/admissions" },
          { label: "Applications" },
        ]}
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
            <Button asChild size="sm" variant="secondary">
              <Link to="/admin/admissions">Dashboard</Link>
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <form
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              {/* Keyword Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search app no, name, phone, email..."
                  className="pl-9 text-sm"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={(val: ApplicationStatus | "ALL") => setStatusFilter(val)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted (New)</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="VERIFICATION_REQUIRED">Verification Required</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desired Class Filter */}
              <div>
                <Select value={classFilter} onValueChange={(val) => setClassFilter(val)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All Target Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.arm ? `(${cls.arm})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Session Filter */}
              <div>
                <Select value={sessionFilter} onValueChange={(val) => setSessionFilter(val)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All Sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sessions</SelectItem>
                    {sessions.map((ses) => (
                      <SelectItem key={ses.id} value={ses.id}>
                        {ses.name} {ses.is_current ? "(Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          {/* Applications Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Loading application directory...
              </div>
            ) : applications.length === 0 ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                <FileCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium text-foreground">No applications found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search keywords or filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-border/80">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Application No</th>
                      <th className="px-4 py-3 font-semibold">Applicant Name</th>
                      <th className="px-4 py-3 font-semibold">Target Class</th>
                      <th className="px-4 py-3 font-semibold">Academic Session</th>
                      <th className="px-4 py-3 font-semibold">Guardian Info</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Conversion</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => openApplicationDetail(app.id)}
                      >
                        <td className="px-4 py-3.5 font-mono font-medium text-foreground">
                          {app.application_number}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-foreground">
                            {app.first_name} {app.last_name}{" "}
                            {app.other_name ? `(${app.other_name})` : ""}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{app.gender}</span>
                            <span>•</span>
                            <span>{app.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-foreground font-medium">
                          {app.desired_class?.name || "Unassigned"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {app.desired_academic_session?.name || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          <div className="text-foreground font-medium">
                            {app.guardian_name} ({app.guardian_relationship})
                          </div>
                          <div>{app.guardian_phone}</div>
                        </td>
                        <td className="px-4 py-3.5">{getStatusBadge(app.status)}</td>
                        <td className="px-4 py-3.5">
                          {app.converted_student_id ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Enrolled Student
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openApplicationDetail(app.id)}
                            className="h-8 gap-1 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Application Review Drawer / Modal */}
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
            {loadingDetail || !selectedApp ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Loading application details...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Profile Bar */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-foreground">
                        {selectedApp.first_name} {selectedApp.last_name}
                      </h2>
                      {getStatusBadge(selectedApp.status)}
                      {selectedApp.converted_student_id && (
                        <Badge className="bg-emerald-600 text-white font-medium text-xs">
                          Student Record Created
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded font-medium text-foreground">
                        {selectedApp.application_number}
                      </span>
                      <span>•</span>
                      <span>
                        Target: {selectedApp.desired_class?.name} (
                        {selectedApp.desired_academic_session?.name})
                      </span>
                      <span>•</span>
                      <span>
                        Submitted:{" "}
                        {selectedApp.submission_date
                          ? new Date(selectedApp.submission_date).toLocaleString()
                          : new Date(selectedApp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="flex items-center gap-2">
                    {selectedApp.status !== "APPROVED" && (
                      <>
                        {selectedApp.status === "SUBMITTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange("UNDER_REVIEW")}
                            disabled={actionLoading}
                          >
                            Start Review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange("VERIFICATION_REQUIRED")}
                          disabled={actionLoading}
                        >
                          Req. Verification
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange("WAITLISTED")}
                          disabled={actionLoading}
                        >
                          Waitlist
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowRejectModal(true)}
                          disabled={actionLoading}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleStatusChange("APPROVED")}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Approve Admission
                        </Button>
                      </>
                    )}

                    {selectedApp.status === "APPROVED" && !selectedApp.converted_student_id && (
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                        onClick={() => setShowConvertModal(true)}
                      >
                        <GraduationCap className="h-4 w-4 mr-1.5" />
                        Convert to Enrolled Student
                      </Button>
                    )}

                    {selectedApp.converted_student_id && (
                      <Button asChild size="sm" variant="secondary" className="gap-1.5">
                        <Link to="/admin/students">
                          <User className="h-4 w-4" />
                          View in Student Directory
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tabs Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="profile">Applicant Profile</TabsTrigger>
                    <TabsTrigger value="documents">
                      Documents ({selectedApp.documents?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      Review Notes ({selectedApp.reviews?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="decision">Admission Decision</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Applicant Profile */}
                  <TabsContent value="profile" className="space-y-6 pt-4">
                    {/* Personal & Contact Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.first_name} {selectedApp.last_name}{" "}
                            {selectedApp.other_name ? `(${selectedApp.other_name})` : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(selectedApp.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.gender}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {selectedApp.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {selectedApp.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {selectedApp.address || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Guardian Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
                        <div>
                          <p className="text-xs text-muted-foreground">Guardian Name</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.guardian_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Relationship</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.guardian_relationship}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Guardian Phone</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.guardian_phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Guardian Email</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.guardian_email || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        Previous Academic Background & Desired Entry
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
                        <div>
                          <p className="text-xs text-muted-foreground">Previous School</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.previous_school || "First-time entry / None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Previous Class</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.previous_class || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Grade Average / Score</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.previous_grade_average || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Desired Class</p>
                          <p className="text-sm font-bold text-primary">
                            {selectedApp.desired_class?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Academic Session</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedApp.desired_academic_session?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Documents & Verification */}
                  <TabsContent value="documents" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Candidate Documents
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Review official credentials and mark as verified
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDocUploadModal(true)}
                        className="gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Attach Document
                      </Button>
                    </div>

                    {!selectedApp.documents || selectedApp.documents.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        No documents uploaded for this application yet.
                      </div>
                    ) : (
                      <div className="divide-y rounded-xl border border-border/80 bg-card overflow-hidden">
                        {selectedApp.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex flex-wrap items-center justify-between p-4 gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground text-sm">
                                    {doc.document_type.replace(/_/g, " ")}
                                  </span>
                                  {doc.is_verified ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs">
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-amber-600 border-amber-500/30 text-xs"
                                    >
                                      Pending Verification
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                  <span>{doc.file_name}</span>
                                  {doc.file_size_bytes && (
                                    <span>• {(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {doc.file_url && (
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs gap-1"
                                >
                                  <a href={doc.file_url} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View File
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={doc.is_verified ? "outline" : "default"}
                                className={`h-8 text-xs gap-1.5 ${
                                  doc.is_verified
                                    ? "text-muted-foreground"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                                onClick={() => handleToggleDocVerification(doc.id, doc.is_verified)}
                              >
                                {doc.is_verified ? (
                                  <>
                                    <X className="h-3.5 w-3.5" />
                                    Unverify
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    Verify Document
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3: Notes & Review Logs */}
                  <TabsContent value="notes" className="space-y-6 pt-4">
                    <form
                      onSubmit={handleAddNote}
                      className="space-y-3 p-4 rounded-xl border border-border bg-card"
                    >
                      <Label htmlFor="newNote" className="text-xs font-semibold">
                        Add Internal Review Note
                      </Label>
                      <Textarea
                        id="newNote"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add review feedback, interview notes, or verification details..."
                        rows={3}
                        required
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isInternal"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="rounded border-border"
                          />
                          <label
                            htmlFor="isInternal"
                            className="text-xs text-muted-foreground cursor-pointer"
                          >
                            Confidential Internal Note (visible to staff only)
                          </label>
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={submittingNote || !newNote.trim()}
                        >
                          {submittingNote ? "Saving..." : "Add Note"}
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                        Review History Timeline
                      </h4>
                      {!selectedApp.reviews || selectedApp.reviews.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center border rounded-lg">
                          No review notes recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedApp.reviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="p-3.5 rounded-lg border border-border/80 bg-muted/20 text-sm space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {rev.reviewer?.full_name || "Admissions Officer"}
                                </span>
                                <div className="flex items-center gap-2">
                                  {rev.is_internal && (
                                    <Badge variant="outline" className="text-[10px] py-0">
                                      Internal
                                    </Badge>
                                  )}
                                  <span>{new Date(rev.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                              <p className="text-foreground leading-relaxed">{rev.note}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 4: Admission Decision & Student Record */}
                  <TabsContent value="decision" className="space-y-6 pt-4">
                    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-foreground">
                            Decision Status: {selectedApp.status}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedApp.reviewed_at
                              ? `Reviewed on ${new Date(selectedApp.reviewed_at).toLocaleString()}`
                              : "Pending official committee review"}
                          </p>
                        </div>
                        {getStatusBadge(selectedApp.status)}
                      </div>

                      {selectedApp.decision_reason && (
                        <div className="p-3 rounded-lg bg-muted/40 border text-sm">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Recorded Decision Reason:
                          </p>
                          <p className="text-foreground">{selectedApp.decision_reason}</p>
                        </div>
                      )}

                      {/* Converted Student Record Details */}
                      {selectedApp.converted_student_id ? (
                        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            Official Student Record Created
                          </div>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            This applicant has been formally admitted and enrolled into the student
                            directory.
                          </p>
                          <div className="flex items-center gap-3 pt-1">
                            <Button
                              asChild
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                              <Link to="/admin/students">
                                <GraduationCap className="h-4 w-4" />
                                Open Student Record in Directory
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : selectedApp.status === "APPROVED" ? (
                        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                            <Sparkles className="h-5 w-5" />
                            Ready for Student Conversion
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Admission has been approved! You can now convert this application into
                            an active student record with an automatic unique Admission Number.
                          </p>
                          <Button
                            onClick={() => setShowConvertModal(true)}
                            className="bg-primary text-primary-foreground gap-2"
                          >
                            <GraduationCap className="h-4 w-4" />
                            Proceed with Student Conversion
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Application must be set to APPROVED before it can be converted into an
                          enrolled student.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Reject Admission Application
              </DialogTitle>
              <DialogDescription>
                Please record the official reason for declining this candidate's application.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Label htmlFor="reason" className="text-xs font-semibold">
                Reason for Rejection *
              </Label>
              <Textarea
                id="reason"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="e.g. Class capacity reached for 2024/2025 session; minimum entrance benchmark not met."
                rows={3}
              />
            </div>
            <DialogFooter className="pt-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("REJECTED", decisionReason)}
                disabled={actionLoading || !decisionReason.trim()}
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Conversion Confirmation Modal */}
        <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Convert Applicant to Enrolled Student
              </DialogTitle>
              <DialogDescription>
                This action will generate a permanent Admission Number, create the official Student
                Record, and register enrollment.
              </DialogDescription>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-lg bg-muted/40 border space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Candidate:</span>
                    <span className="font-semibold text-foreground">
                      {selectedApp.first_name} {selectedApp.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Class:</span>
                    <span className="font-semibold text-foreground">
                      {selectedApp.desired_class?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Academic Session:</span>
                    <span className="font-semibold text-foreground">
                      {selectedApp.desired_academic_session?.name}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="termSelect" className="text-xs font-semibold">
                    Initial Enrollment Term *
                  </Label>
                  <Select value={selectedTermId} onValueChange={(val) => setSelectedTermId(val)}>
                    <SelectTrigger id="termSelect">
                      <SelectValue placeholder="Select enrollment term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms
                        .filter(
                          (t) => t.academic_session_id === selectedApp.desired_academic_session_id,
                        )
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.is_current ? "(Current Term)" : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                variant="outline"
                onClick={() => setShowConvertModal(false)}
                disabled={converting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertStudent}
                disabled={converting || !selectedTermId}
                className="bg-primary text-primary-foreground"
              >
                {converting ? "Creating Student..." : "Confirm & Enroll"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Document Modal */}
        <Dialog open={showDocUploadModal} onOpenChange={setShowDocUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Application Document
              </DialogTitle>
              <DialogDescription>
                Attach birth certificate, academic transcript, or verification document.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUploadDocument} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="docType" className="text-xs font-semibold">
                  Document Type *
                </Label>
                <Select
                  value={uploadDocType}
                  onValueChange={(val: AdmissionDocType) => setUploadDocType(val)}
                >
                  <SelectTrigger id="docType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIRTH_CERTIFICATE">Birth Certificate</SelectItem>
                    <SelectItem value="PREVIOUS_REPORT_CARD">
                      Previous School Report Card / Transcript
                    </SelectItem>
                    <SelectItem value="PASSPORT_PHOTO">Passport Photograph</SelectItem>
                    <SelectItem value="MEDICAL_REPORT">Medical Report</SelectItem>
                    <SelectItem value="NATIONAL_ID_GUARDIAN">Guardian Identification</SelectItem>
                    <SelectItem value="OTHER">Other Credential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fileInput" className="text-xs font-semibold">
                  Choose File (PDF, PNG, JPG) *
                </Label>
                <Input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  required
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDocUploadModal(false)}
                  disabled={uploadingDoc}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadingDoc || !uploadFile}>
                  {uploadingDoc ? "Uploading..." : "Upload Document"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
