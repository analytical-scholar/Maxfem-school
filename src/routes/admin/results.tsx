import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Layers,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Eye,
  FileText,
  Printer,
  ShieldCheck,
  Search,
  Filter,
  BarChart3,
  CheckSquare,
  Square,
  Sparkles,
  Users,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultCorrectionModal } from "@/components/results/ResultCorrectionModal";
import { CorrectionAuditHistoryModal } from "@/components/results/CorrectionAuditHistoryModal";
import { ReportCardView } from "@/components/results/ReportCardView";
import { AcademicAnalyticsTab } from "@/components/results/AcademicAnalyticsTab";
import {
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
  StudentSubjectResult,
  StudentTermResult,
  GradingScale,
  AcademicAnalytics,
  StudentReportCardData,
} from "@/types/database";
import {
  fetchClasses,
  fetchSubjects,
  fetchAcademicSessions,
  fetchTerms,
  fetchSubjectResults,
  fetchGradingScales,
  updateResultStatusBatch,
  fetchClassAcademicAnalytics,
  fetchStudentReportCard,
  fetchClassTermResults,
} from "@/lib/school-service";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/results")({
  component: AdminResultsPage,
});

function AdminResultsPage() {
  const { profile, role } = useAuth();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [subjectResults, setSubjectResults] = useState<StudentSubjectResult[]>([]);
  const [termRankings, setTermRankings] = useState<StudentTermResult[]>([]);
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [analytics, setAnalytics] = useState<AcademicAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<"moderation" | "broadsheet" | "analytics">(
    "moderation",
  );

  // Modal States
  const [correctionTarget, setCorrectionTarget] = useState<StudentSubjectResult | null>(null);
  const [auditTargetId, setAuditTargetId] = useState<string | null>(null);
  const [reportCardData, setReportCardData] = useState<StudentReportCardData | null>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);

  // Load baseline configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const [cls, subjs, sess, trms, scales] = await Promise.all([
          fetchClasses(),
          fetchSubjects(),
          fetchAcademicSessions(),
          fetchTerms(),
          fetchGradingScales(),
        ]);
        setClasses(cls);
        setSubjects(subjs);
        setSessions(sess);
        setTerms(trms);
        setGradingScales(scales);

        if (cls.length > 0) setSelectedClassId(cls[0].id);
        const currentSess = sess.find((s) => s.is_current) || sess[0];
        if (currentSess) {
          setSelectedSessionId(currentSess.id);
          const currentT =
            trms.find((t) => t.is_current && t.academic_session_id === currentSess.id) ||
            trms.find((t) => t.academic_session_id === currentSess.id) ||
            trms[0];
          if (currentT) {
            setSelectedTermId(currentT.id);
          }
        }
      } catch (err) {
        console.error("Error loading admin results config:", err);
      }
    }
    loadConfig();
  }, []);

  // Fetch results and analytics whenever filters change
  const refreshResults = async () => {
    if (!selectedClassId || !selectedSessionId || !selectedTermId) return;
    setLoading(true);
    setFeedbackMsg(null);
    setSelectedResultIds([]);

    try {
      const [results, rankings, ana] = await Promise.all([
        fetchSubjectResults({
          classId: selectedClassId,
          subjectId: selectedSubjectId === "ALL" ? undefined : selectedSubjectId,
          sessionId: selectedSessionId,
          termId: selectedTermId,
          status:
            statusFilter === "ALL" ? undefined : (statusFilter as StudentSubjectResult["status"]),
        }),
        fetchClassTermResults(selectedClassId, selectedSessionId, selectedTermId),
        fetchClassAcademicAnalytics(
          selectedClassId,
          selectedSessionId,
          selectedTermId,
          selectedSubjectId === "ALL" ? undefined : selectedSubjectId,
        ),
      ]);

      setSubjectResults(results);
      setTermRankings(rankings);
      setAnalytics(ana);
    } catch (err) {
      console.error("Failed to load results for moderation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshResults();
  }, [selectedClassId, selectedSubjectId, selectedSessionId, selectedTermId, statusFilter]);

  // Bulk status transition handler
  const handleBulkStatusTransition = async (
    targetStatus: "REVIEWED" | "APPROVED" | "PUBLISHED" | "LOCKED",
  ) => {
    if (selectedResultIds.length === 0) return;
    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await updateResultStatusBatch(
        selectedResultIds,
        targetStatus,
        profile?.id || "admin-actor",
        role || "ADMIN",
      );

      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Successfully updated ${res.count} result(s) to status: ${targetStatus}.`,
        });
        await refreshResults();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to update status." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing batch status update";
      setFeedbackMsg({ type: "error", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedResultIds.length === filteredResults.length) {
      setSelectedResultIds([]);
    } else {
      setSelectedResultIds(filteredResults.map((r) => r.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedResultIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleOpenStudentReportCard = async (studentId: string) => {
    setLoadingReportCard(true);
    try {
      const data = await fetchStudentReportCard(studentId, selectedSessionId, selectedTermId);
      if (data) {
        setReportCardData(data);
      }
    } catch (err) {
      console.error("Error opening student report card:", err);
    } finally {
      setLoadingReportCard(false);
    }
  };

  const filteredResults = subjectResults.filter((r) => {
    const sName = `${r.student?.last_name || ""} ${r.student?.first_name || ""}`.toLowerCase();
    const adm = (r.student?.admission_number || "").toLowerCase();
    const subName = (r.subject?.name || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return sName.includes(q) || adm.includes(q) || subName.includes(q);
  });

  const countDraft = subjectResults.filter((r) => r.status === "DRAFT").length;
  const countSubmitted = subjectResults.filter((r) => r.status === "SUBMITTED").length;
  const countReviewed = subjectResults.filter((r) => r.status === "REVIEWED").length;
  const countApproved = subjectResults.filter((r) => r.status === "APPROVED").length;
  const countPublished = subjectResults.filter((r) => r.status === "PUBLISHED").length;
  const countLocked = subjectResults.filter((r) => r.status === "LOCKED").length;

  return (
    <PortalLayout
      title="Results & Academic Analytics Moderation"
      subtitle="Institutional governance, multi-stage approval workflow, controlled audited corrections, and terminal broadsheets"
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1.5 py-1 px-2.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Audit Logging Enforced
          </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Lifecycle KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Drafts
            </span>
            <p className="mt-1 text-xl font-black text-zinc-700 dark:text-zinc-300">{countDraft}</p>
            <span className="text-[10px] text-zinc-400">Teacher editing</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Submitted
            </span>
            <p className="mt-1 text-xl font-black text-amber-800 dark:text-amber-300">
              {countSubmitted}
            </p>
            <span className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
              Awaiting review
            </span>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Reviewed
            </span>
            <p className="mt-1 text-xl font-black text-blue-800 dark:text-blue-300">
              {countReviewed}
            </p>
            <span className="text-[10px] text-blue-600/70 dark:text-blue-400/60">
              Vetted by HOD
            </span>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3.5 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Approved
            </span>
            <p className="mt-1 text-xl font-black text-indigo-800 dark:text-indigo-300">
              {countApproved}
            </p>
            <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/60">
              Ready to publish
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Published
            </span>
            <p className="mt-1 text-xl font-black text-emerald-800 dark:text-emerald-300">
              {countPublished}
            </p>
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60">
              Visible to student
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Locked
            </span>
            <p className="mt-1 text-xl font-black text-zinc-900 dark:text-white">{countLocked}</p>
            <span className="text-[10px] text-zinc-400">Archived/Read-only</span>
          </div>
        </div>

        {/* Global Filter Toolbar */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Academic Scope & Moderation Filters
              </h3>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                id="admin-search-results-input"
                placeholder="Search student or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="admin-class-select" className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger id="admin-subject-select" className="h-8 text-xs mt-1">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-semibold">
                    All Subjects
                  </SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Session</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger id="admin-session-select" className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} {s.is_current && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Term</label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger id="admin-term-select" className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  {terms
                    .filter(
                      (t) => !selectedSessionId || t.academic_session_id === selectedSessionId,
                    )
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">
                Status Lifecycle
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="admin-status-select" className="h-8 text-xs mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="DRAFT" className="text-xs">
                    Draft
                  </SelectItem>
                  <SelectItem value="SUBMITTED" className="text-xs">
                    Submitted
                  </SelectItem>
                  <SelectItem value="REVIEWED" className="text-xs">
                    Reviewed
                  </SelectItem>
                  <SelectItem value="APPROVED" className="text-xs">
                    Approved
                  </SelectItem>
                  <SelectItem value="PUBLISHED" className="text-xs">
                    Published
                  </SelectItem>
                  <SelectItem value="LOCKED" className="text-xs">
                    Locked
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3.5 text-xs ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Main Tab Views */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="moderation" className="text-xs">
              <Award className="h-3.5 w-3.5 mr-1.5" />
              Result Moderation ({filteredResults.length})
            </TabsTrigger>
            <TabsTrigger value="broadsheet" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Class Broad Sheet ({termRankings.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Academic Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Result Moderation Matrix */}
          <TabsContent value="moderation" className="mt-4 space-y-4">
            {/* Batch Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Button
                  id="admin-select-all-btn"
                  onClick={handleSelectAll}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  {selectedResultIds.length === filteredResults.length &&
                  filteredResults.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-400" />
                  )}
                  Select All ({filteredResults.length})
                </Button>
                <span className="text-zinc-400">•</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {selectedResultIds.length} item(s) selected
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  id="admin-mark-reviewed-btn"
                  onClick={() => handleBulkStatusTransition("REVIEWED")}
                  disabled={actionLoading || selectedResultIds.length === 0}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-blue-300 text-blue-800 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                >
                  Mark Reviewed
                </Button>
                <Button
                  id="admin-approve-btn"
                  onClick={() => handleBulkStatusTransition("APPROVED")}
                  disabled={actionLoading || selectedResultIds.length === 0}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-indigo-300 text-indigo-800 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                >
                  Approve Results
                </Button>
                <Button
                  id="admin-publish-btn"
                  onClick={() => handleBulkStatusTransition("PUBLISHED")}
                  disabled={actionLoading || selectedResultIds.length === 0}
                  size="sm"
                  className="h-8 text-xs bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
                >
                  Publish to Students
                </Button>
                <Button
                  id="admin-lock-btn"
                  onClick={() => handleBulkStatusTransition("LOCKED")}
                  disabled={actionLoading || selectedResultIds.length === 0}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-zinc-400 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Lock
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-center space-y-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
                  <p className="text-sm font-medium text-zinc-500">Loading student results...</p>
                </div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <Award className="h-8 w-8 mx-auto text-zinc-400" />
                <h4 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
                  No Subject Results Found
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                  No recorded subject marks match the selected filter criteria.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <th className="py-3 px-3 text-center w-10">Select</th>
                        <th className="py-3 px-3">Student</th>
                        <th className="py-3 px-3">Subject</th>
                        <th className="py-3 px-2 text-center">CA (40)</th>
                        <th className="py-3 px-2 text-center">Exam (70)</th>
                        <th className="py-3 px-2 text-center">Total</th>
                        <th className="py-3 px-2 text-center">Grade</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Audited Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {filteredResults.map((r) => {
                        const isSelected = selectedResultIds.includes(r.id);
                        return (
                          <tr
                            key={r.id}
                            className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 ${
                              isSelected ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                id={`select-result-${r.id}`}
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOne(r.id)}
                                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-zinc-900 dark:text-white">
                                {r.student?.last_name}, {r.student?.first_name}
                              </p>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {r.student?.admission_number}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                              {r.subject?.name}
                              <span className="text-[10px] text-zinc-400 ml-1 font-normal">
                                ({r.subject?.code})
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                              {r.ca_score}
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                              {r.exam_score}
                            </td>
                            <td className="py-3 px-2 text-center font-black text-sm text-zinc-900 dark:text-white">
                              {r.total_score}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded font-black text-[11px] ${
                                  r.grade === "A+" || r.grade === "A"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : r.grade === "B"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : r.grade === "C"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        : Number(r.total_score) >= 50
                                          ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {r.grade}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold uppercase ${
                                  r.status === "PUBLISHED"
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : r.status === "APPROVED"
                                      ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                                      : r.status === "REVIEWED"
                                        ? "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                        : r.status === "SUBMITTED"
                                          ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                          : r.status === "LOCKED"
                                            ? "border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                            : "border-zinc-200 text-zinc-600 dark:text-zinc-400"
                                }`}
                              >
                                {r.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  id={`correct-result-${r.id}`}
                                  onClick={() => setCorrectionTarget(r)}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px] gap-1 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300"
                                  title="Audited Score Correction"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  Correct
                                </Button>
                                <Button
                                  id={`audit-history-${r.id}`}
                                  onClick={() => setAuditTargetId(r.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  title="View Immutable Audit Log"
                                >
                                  <History className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Class Broad Sheet & Terminal Rankings */}
          <TabsContent value="broadsheet" className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Terminal Class Broad Sheet & Scholar Rankings
                </h4>
                <p className="text-xs text-zinc-500">
                  Comprehensive performance roster with auto-calculated class rank & GPA
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs border-emerald-300 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold"
              >
                {termRankings.length} Ranked Students
              </Badge>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                Loading class terminal broad sheet...
              </div>
            ) : termRankings.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <Users className="h-8 w-8 mx-auto text-zinc-400" />
                <p className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
                  No Term Rankings Calculated Yet
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Once subject results are saved and evaluated, the class term broad sheet will
                  populate automatically.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <th className="py-3 px-3 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-3 text-center">Marks Obtained</th>
                        <th className="py-3 px-3 text-center">Average (%)</th>
                        <th className="py-3 px-3 text-center">GPA</th>
                        <th className="py-3 px-3 text-center">Decision</th>
                        <th className="py-3 px-4 text-right">Report Card</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {termRankings.map((tr) => (
                        <tr key={tr.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 font-black text-zinc-900 dark:text-white text-xs">
                              {tr.class_rank || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-900 dark:text-white">
                              {tr.student?.last_name}, {tr.student?.first_name}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {tr.student?.admission_number}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-zinc-900 dark:text-white">
                            {tr.total_score_obtained}{" "}
                            <span className="text-zinc-400 font-normal">
                              / {tr.total_possible_score}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-black text-sm text-emerald-700 dark:text-emerald-400">
                            {tr.average_score}%
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-blue-700 dark:text-blue-400">
                            {tr.gpa}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                tr.average_score >= 50
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                              }`}
                            >
                              {tr.decision ||
                                (tr.average_score >= 50 ? "PROMOTED / PASS" : "PROBATION")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              id={`view-report-card-${tr.student_id}`}
                              onClick={() => handleOpenStudentReportCard(tr.student_id)}
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] gap-1.5 border-zinc-300 dark:border-zinc-700"
                            >
                              <FileText className="h-3.5 w-3.5 text-zinc-500" />
                              Report Card
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Academic Analytics */}
          <TabsContent value="analytics" className="mt-4">
            {analytics ? (
              <AcademicAnalyticsTab analytics={analytics} />
            ) : (
              <div className="py-12 text-center text-sm text-zinc-500">
                Loading academic analytics...
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Controlled Result Correction Modal */}
      {correctionTarget && (
        <ResultCorrectionModal
          result={correctionTarget}
          gradingScales={gradingScales}
          onClose={() => setCorrectionTarget(null)}
          onSuccess={() => {
            setFeedbackMsg({
              type: "success",
              text: "Audited result correction successfully applied and logged.",
            });
            refreshResults();
          }}
        />
      )}

      {/* Correction Audit History Modal */}
      {auditTargetId && (
        <CorrectionAuditHistoryModal
          subjectResultId={auditTargetId}
          onClose={() => setAuditTargetId(null)}
        />
      )}

      {/* Official Report Card View */}
      {reportCardData && (
        <ReportCardView data={reportCardData} onClose={() => setReportCardData(null)} />
      )}
    </PortalLayout>
  );
}
