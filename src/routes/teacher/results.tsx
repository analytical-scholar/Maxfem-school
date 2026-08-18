import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Layers,
  BookOpen,
  Calendar,
  Save,
  Send,
  Download,
  Laptop,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  Lock,
  Clock,
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
import { AcademicAnalyticsTab } from "@/components/results/AcademicAnalyticsTab";
import {
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
  StudentEnrollment,
  StudentSubjectResult,
  GradingScale,
  Examination,
  AcademicAnalytics,
} from "@/types/database";
import {
  fetchClasses,
  fetchSubjects,
  fetchAcademicSessions,
  fetchTerms,
  fetchStudentEnrollments,
  fetchSubjectResults,
  fetchGradingScales,
  computeGrade,
  saveSubjectResultsBatch,
  submitSubjectResults,
  fetchClassAcademicAnalytics,
  fetchExaminations,
  importCbtScoresToSubjectResults,
} from "@/lib/school-service";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/teacher/results")({
  component: TeacherResultsPage,
});

interface ScoreRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  resultId?: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gpaPoint: number;
  teacherRemark: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "PUBLISHED" | "LOCKED";
  isDirty?: boolean;
}

function TeacherResultsPage() {
  const { profile } = useAuth();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  const [availableCbtExams, setAvailableCbtExams] = useState<Examination[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importingCbt, setImportingCbt] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [analytics, setAnalytics] = useState<AcademicAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<"grading" | "analytics">("grading");

  // Load initial reference data
  useEffect(() => {
    async function loadData() {
      try {
        const [clsData, subjData, sessData, termData, scalesData] = await Promise.all([
          fetchClasses(),
          fetchSubjects(),
          fetchAcademicSessions(),
          fetchTerms(),
          fetchGradingScales(),
        ]);
        setClasses(clsData);
        setSubjects(subjData);
        setSessions(sessData);
        setTerms(termData);
        setGradingScales(scalesData);

        if (clsData.length > 0) setSelectedClassId(clsData[0].id);
        if (subjData.length > 0) setSelectedSubjectId(subjData[0].id);

        const currentSess = sessData.find((s) => s.is_current) || sessData[0];
        if (currentSess) {
          setSelectedSessionId(currentSess.id);
          const currentT =
            termData.find((t) => t.is_current && t.academic_session_id === currentSess.id) ||
            termData.find((t) => t.academic_session_id === currentSess.id) ||
            termData[0];
          if (currentT) {
            setSelectedTermId(currentT.id);
          }
        }
      } catch (err) {
        console.error("Error loading teacher results setup data:", err);
      }
    }
    loadData();
  }, []);

  // Fetch enrolled students and their current results for the selected combination
  useEffect(() => {
    async function loadStudentScores() {
      if (!selectedClassId || !selectedSubjectId || !selectedSessionId || !selectedTermId) return;
      setLoading(true);
      setFeedbackMsg(null);

      try {
        const [enrollments, existingResults, cbtExamsList, analyticsData] = await Promise.all([
          fetchStudentEnrollments(selectedClassId, selectedSessionId, selectedTermId),
          fetchSubjectResults({
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            sessionId: selectedSessionId,
            termId: selectedTermId,
          }),
          fetchExaminations({
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            sessionId: selectedSessionId,
            termId: selectedTermId,
          }),
          fetchClassAcademicAnalytics(
            selectedClassId,
            selectedSessionId,
            selectedTermId,
            selectedSubjectId,
          ),
        ]);

        setAvailableCbtExams(cbtExamsList);
        setAnalytics(analyticsData);

        // Build score rows combining active enrollments and existing marks
        const rows: ScoreRow[] = enrollments.map((enr) => {
          const res = existingResults.find((r) => r.student_id === enr.student_id);
          const ca = res ? Number(res.ca_score) : 0;
          const exam = res ? Number(res.exam_score) : 0;
          const total = res ? Number(res.total_score) : ca + exam;
          const { grade, gpaPoint } = computeGrade(total, 100, gradingScales);

          return {
            enrollmentId: enr.id,
            studentId: enr.student_id,
            studentName: enr.student
              ? `${enr.student.last_name}, ${enr.student.first_name}`
              : "Student",
            admissionNumber: enr.student?.admission_number || "ADM-000",
            resultId: res?.id,
            caScore: ca,
            examScore: exam,
            totalScore: total,
            grade: res?.grade || grade,
            gpaPoint: res?.gpa_point || gpaPoint,
            teacherRemark: res?.teacher_remark || "",
            status: (res?.status as ScoreRow["status"]) || "DRAFT",
            isDirty: false,
          };
        });

        setScoreRows(rows);
      } catch (err) {
        console.error("Failed to load student score rows:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentScores();
  }, [selectedClassId, selectedSubjectId, selectedSessionId, selectedTermId, gradingScales]);

  // Handle live score input changes
  const handleScoreChange = (
    studentId: string,
    field: "caScore" | "examScore" | "teacherRemark",
    value: string | number,
  ) => {
    setScoreRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;

        // If row is locked, prevent modification
        if (row.status === "LOCKED" || row.status === "PUBLISHED") {
          return row;
        }

        const updated = { ...row, isDirty: true };

        if (field === "caScore") {
          const num = Math.max(0, Math.min(40, parseFloat(value as string) || 0));
          updated.caScore = num;
        } else if (field === "examScore") {
          const num = Math.max(0, Math.min(70, parseFloat(value as string) || 0));
          updated.examScore = num;
        } else if (field === "teacherRemark") {
          updated.teacherRemark = value as string;
        }

        const newTotal = Math.min(100, updated.caScore + updated.examScore);
        const { grade, gpaPoint } = computeGrade(newTotal, 100, gradingScales);
        updated.totalScore = newTotal;
        updated.grade = grade;
        updated.gpaPoint = gpaPoint;

        return updated;
      }),
    );
  };

  // Save all as DRAFT
  const handleSaveDrafts = async () => {
    setSaving(true);
    setFeedbackMsg(null);

    try {
      const payload = scoreRows.map((r) => ({
        id: r.resultId,
        student_id: r.studentId,
        subject_id: selectedSubjectId,
        class_id: selectedClassId,
        academic_session_id: selectedSessionId,
        term_id: selectedTermId,
        ca_score: r.caScore,
        exam_score: r.examScore,
        teacher_remark: r.teacherRemark,
        status: r.status === "LOCKED" || r.status === "PUBLISHED" ? r.status : "DRAFT",
      }));

      const res = await saveSubjectResultsBatch(payload, profile?.id || "teacher-actor");
      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Successfully saved ${res.count} student result drafts.`,
        });
        setScoreRows((prev) => prev.map((r) => ({ ...r, isDirty: false })));
        // Refresh analytics
        const ana = await fetchClassAcademicAnalytics(
          selectedClassId,
          selectedSessionId,
          selectedTermId,
          selectedSubjectId,
        );
        setAnalytics(ana);
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to save results" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected save failure";
      setFeedbackMsg({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  // Submit all drafts for administrative approval
  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      // First save drafts to ensure latest marks are captured
      await handleSaveDrafts();

      // Fetch saved result IDs
      const results = await fetchSubjectResults({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        sessionId: selectedSessionId,
        termId: selectedTermId,
      });

      const draftIds = results.filter((r) => r.status === "DRAFT").map((r) => r.id);
      if (draftIds.length === 0) {
        setFeedbackMsg({
          type: "error",
          text: "No editable draft results found to submit.",
        });
        setSubmitting(false);
        return;
      }

      const submitRes = await submitSubjectResults(draftIds, profile?.id || "teacher-actor");
      if (submitRes.success) {
        setFeedbackMsg({
          type: "success",
          text: `Successfully submitted ${draftIds.length} subject results for Administrative Review & Approval.`,
        });
        setScoreRows((prev) =>
          prev.map((r) =>
            r.status === "DRAFT" ? { ...r, status: "SUBMITTED", isDirty: false } : r,
          ),
        );
      } else {
        setFeedbackMsg({
          type: "error",
          text: submitRes.error || "Failed to submit results",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      setFeedbackMsg({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Import CBT Scores from Phase 5 CBT Examination
  const handleImportCbtExamScores = async (examId: string) => {
    setImportingCbt(true);
    setFeedbackMsg(null);

    try {
      const res = await importCbtScoresToSubjectResults(examId, profile?.id || "teacher-actor");
      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Successfully imported ${res.importedCount} student scores from Phase 5 CBT examination into exam marks.`,
        });
        // Reload data
        const updated = await fetchSubjectResults({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          sessionId: selectedSessionId,
          termId: selectedTermId,
        });
        setScoreRows((prev) =>
          prev.map((row) => {
            const match = updated.find((u) => u.student_id === row.studentId);
            if (!match) return row;
            return {
              ...row,
              resultId: match.id,
              examScore: Number(match.exam_score),
              totalScore: Number(match.total_score),
              grade: match.grade,
              gpaPoint: match.gpa_point,
              status: match.status,
              isDirty: false,
            };
          }),
        );
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to import CBT scores." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CBT import error";
      setFeedbackMsg({ type: "error", text: msg });
    } finally {
      setImportingCbt(false);
    }
  };

  const filteredRows = scoreRows.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isAnyLocked = scoreRows.some((r) => r.status === "LOCKED" || r.status === "PUBLISHED");
  const draftCount = scoreRows.filter((r) => r.status === "DRAFT").length;
  const submittedCount = scoreRows.filter((r) => r.status === "SUBMITTED").length;
  const approvedCount = scoreRows.filter((r) => r.status === "APPROVED").length;
  const publishedCount = scoreRows.filter((r) => r.status === "PUBLISHED").length;

  return (
    <PortalLayout
      title="Results & Continuous Assessment Grading"
      subtitle="Input subject CA marks, import CBT exam scores, compute grades, and submit for administrative review"
      actions={
        <div className="flex items-center gap-2">
          <Button
            id="teacher-save-drafts-btn"
            onClick={handleSaveDrafts}
            disabled={saving || loading || scoreRows.length === 0}
            variant="outline"
            size="sm"
            className="gap-2 border-zinc-300 dark:border-zinc-700"
          >
            <Save className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            {saving ? "Saving..." : "Save Drafts"}
          </Button>
          <Button
            id="teacher-submit-review-btn"
            onClick={handleSubmitForApproval}
            disabled={submitting || loading || draftCount === 0}
            size="sm"
            className="gap-2 bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : `Submit for Review (${draftCount})`}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter & Assignment Selector Controls */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Teacher Grading Workspace
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select your assigned class and subject curriculum
                </p>
              </div>
            </div>

            {/* Lifecycle Badges Overview */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="text-zinc-600 dark:text-zinc-400">
                Draft: <strong>{draftCount}</strong>
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              >
                Submitted: <strong>{submittedCount}</strong>
              </Badge>
              <Badge
                variant="outline"
                className="border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
              >
                Approved: <strong>{approvedCount}</strong>
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                Published: <strong>{publishedCount}</strong>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500">Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="teacher-class-select" className="h-9 text-xs mt-1">
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
              <label className="text-[11px] font-semibold text-zinc-500">Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger id="teacher-subject-select" className="h-9 text-xs mt-1">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-500">Academic Session</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger id="teacher-session-select" className="h-9 text-xs mt-1">
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
              <label className="text-[11px] font-semibold text-zinc-500">Term</label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger id="teacher-term-select" className="h-9 text-xs mt-1">
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
          </div>
        </div>

        {/* Phase 5 CBT Score Import Banner */}
        {availableCbtExams.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Phase 5 CBT Integration:</strong> Found{" "}
                <strong>{availableCbtExams.length}</strong> CBT exam(s) for this subject & class.
                You can automatically import student examination marks directly.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {availableCbtExams.map((exam) => (
                <Button
                  key={exam.id}
                  id={`import-cbt-exam-${exam.id}`}
                  onClick={() => handleImportCbtExamScores(exam.id)}
                  disabled={importingCbt}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 border-blue-300 bg-white text-blue-800 hover:bg-blue-100 dark:bg-zinc-900 dark:text-blue-300 dark:border-blue-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  {importingCbt ? "Importing..." : `Import CBT: "${exam.title}"`}
                </Button>
              ))}
            </div>
          </div>
        )}

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
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* View Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="grading" className="text-xs">
              <Award className="h-3.5 w-3.5 mr-1.5" />
              Score Matrix ({filteredRows.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Class Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Score Entry Matrix */}
          <TabsContent value="grading" className="mt-4 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="teacher-student-search-input"
                  placeholder="Filter student by name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs"
                />
              </div>
              <div className="text-xs text-zinc-500">
                Formula: <strong>Total = CA (max 40) + Exam (max 70)</strong> (Capped at 100%)
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-center space-y-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
                  <p className="text-sm font-medium text-zinc-500">
                    Loading student roster and marks...
                  </p>
                </div>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <AlertCircle className="h-8 w-8 mx-auto text-zinc-400" />
                <h4 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
                  No Students Enrolled
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                  No active student enrollments found for the selected class, session, and term.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Student Info</th>
                        <th className="py-3 px-3 text-center w-28">CA Score (40)</th>
                        <th className="py-3 px-3 text-center w-28">Exam Score (70)</th>
                        <th className="py-3 px-3 text-center w-24">Total (100)</th>
                        <th className="py-3 px-3 text-center w-20">Grade</th>
                        <th className="py-3 px-4">Teacher Remark</th>
                        <th className="py-3 px-3 text-center w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {filteredRows.map((row, idx) => {
                        const isLocked = row.status === "LOCKED" || row.status === "PUBLISHED";
                        const isSubmitted =
                          row.status === "SUBMITTED" ||
                          row.status === "REVIEWED" ||
                          row.status === "APPROVED";

                        return (
                          <tr
                            key={row.studentId}
                            className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 ${
                              row.isDirty ? "bg-amber-50/30 dark:bg-amber-950/20" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-zinc-900 dark:text-white">
                                {row.studentName}
                              </p>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {row.admissionNumber}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Input
                                id={`ca-score-${row.studentId}`}
                                type="number"
                                min="0"
                                max="40"
                                step="0.5"
                                disabled={isLocked}
                                value={row.caScore}
                                onChange={(e) =>
                                  handleScoreChange(row.studentId, "caScore", e.target.value)
                                }
                                className="h-8 text-center text-xs font-semibold w-20 mx-auto"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Input
                                id={`exam-score-${row.studentId}`}
                                type="number"
                                min="0"
                                max="70"
                                step="0.5"
                                disabled={isLocked}
                                value={row.examScore}
                                onChange={(e) =>
                                  handleScoreChange(row.studentId, "examScore", e.target.value)
                                }
                                className="h-8 text-center text-xs font-semibold w-20 mx-auto"
                              />
                            </td>
                            <td className="py-3 px-3 text-center font-black text-sm text-zinc-900 dark:text-white">
                              {row.totalScore}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                                  row.grade === "A+" || row.grade === "A"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : row.grade === "B"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : row.grade === "C"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        : Number(row.totalScore) >= 50
                                          ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {row.grade}
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              <Input
                                id={`remark-${row.studentId}`}
                                placeholder="Add subject remark..."
                                disabled={isLocked}
                                value={row.teacherRemark}
                                onChange={(e) =>
                                  handleScoreChange(row.studentId, "teacherRemark", e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              {isLocked ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 gap-1"
                                >
                                  <Lock className="h-2.5 w-2.5" /> {row.status}
                                </Badge>
                              ) : isSubmitted ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 gap-1"
                                >
                                  <Clock className="h-2.5 w-2.5" /> {row.status}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-zinc-200 text-zinc-600 dark:text-zinc-400"
                                >
                                  DRAFT
                                </Badge>
                              )}
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

          {/* Tab 2: Class Performance Analytics */}
          <TabsContent value="analytics" className="mt-4">
            {analytics ? (
              <AcademicAnalyticsTab analytics={analytics} />
            ) : (
              <div className="py-12 text-center text-sm text-zinc-500">
                Loading class academic analytics...
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
