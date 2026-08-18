import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  Printer,
  ShieldCheck,
  TrendingUp,
  Clock,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportCardView } from "@/components/results/ReportCardView";
import {
  StudentSubjectResult,
  StudentTermResult,
  Student,
  AcademicSession,
  Term,
  GradingScale,
  StudentReportCardData,
} from "@/types/database";
import {
  fetchStudentPublishedResults,
  fetchAcademicSessions,
  fetchTerms,
  fetchGradingScales,
  fetchStudentReportCard,
} from "@/lib/school-service";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/results")({
  component: StudentResultsPage,
});

function StudentResultsPage() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  const [student, setStudent] = useState<Student | null>(null);
  const [subjectResults, setSubjectResults] = useState<StudentSubjectResult[]>([]);
  const [termSummary, setTermSummary] = useState<StudentTermResult | null>(null);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);

  // Report Card Modal State
  const [reportCardData, setReportCardData] = useState<StudentReportCardData | null>(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [loadingReportCard, setLoadingReportCard] = useState(false);

  // Load initial academic context
  useEffect(() => {
    async function loadContext() {
      try {
        const [sessData, termData, scalesData] = await Promise.all([
          fetchAcademicSessions(),
          fetchTerms(),
          fetchGradingScales(),
        ]);
        setSessions(sessData);
        setTerms(termData);
        setGradingScales(scalesData);

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
        console.error("Failed to load student result context:", err);
      }
    }
    loadContext();
  }, []);

  // Fetch student published results when selection changes
  useEffect(() => {
    async function loadResults() {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const res = await fetchStudentPublishedResults(
          profile.id,
          selectedSessionId || undefined,
          selectedTermId || undefined,
        );
        setStudent(res.student);
        setSubjectResults(res.subjectResults);
        setTermSummary(res.termSummary);
      } catch (err) {
        console.error("Error loading published results:", err);
      } finally {
        setLoading(false);
      }
    }
    if (profile?.id) {
      loadResults();
    }
  }, [profile?.id, selectedSessionId, selectedTermId]);

  const handleOpenReportCard = async () => {
    if (!student || !selectedSessionId || !selectedTermId) return;
    setLoadingReportCard(true);
    try {
      const data = await fetchStudentReportCard(student.id, selectedSessionId, selectedTermId);
      if (data) {
        setReportCardData(data);
        setShowReportCardModal(true);
      }
    } catch (err) {
      console.error("Failed to fetch student report card:", err);
    } finally {
      setLoadingReportCard(false);
    }
  };

  const totalScore =
    termSummary?.total_score_obtained ??
    subjectResults.reduce((acc, r) => acc + (Number(r.total_score) || 0), 0);
  const totalMax = termSummary?.total_possible_score ?? subjectResults.length * 100;
  const average =
    termSummary?.average_score ??
    (subjectResults.length > 0 ? Number((totalScore / subjectResults.length).toFixed(2)) : 0);
  const gpa =
    termSummary?.gpa ??
    (subjectResults.length > 0
      ? Number(
          (
            subjectResults.reduce((acc, r) => acc + (Number(r.gpa_point) || 0), 0) /
            subjectResults.length
          ).toFixed(2),
        )
      : 0);

  const getRankSuffix = (rank: number) => {
    if (!rank) return "";
    const j = rank % 10;
    const k = rank % 100;
    if (j === 1 && k !== 11) return `${rank}st`;
    if (j === 2 && k !== 12) return `${rank}nd`;
    if (j === 3 && k !== 13) return `${rank}rd`;
    return `${rank}th`;
  };

  return (
    <PortalLayout
      title="Academic Results & Terminal Reports"
      subtitle="View your official published examination marks and verified report cards"
      actions={
        <Button
          id="student-view-report-card-btn"
          onClick={handleOpenReportCard}
          disabled={loading || subjectResults.length === 0 || loadingReportCard}
          className="gap-2 bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
        >
          <Printer className="h-4 w-4" />
          {loadingReportCard ? "Generating..." : "Official Terminal Report Card"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Term & Session Filter Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Published Results Workspace
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Security-verified records signed by Maxfem Academic Board
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger id="student-session-select" className="h-9 text-xs">
                  <SelectValue placeholder="Academic Session" />
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

            <div className="w-44">
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger id="student-term-select" className="h-9 text-xs">
                  <SelectValue placeholder="Term" />
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

        {/* Security & Integrity Note */}
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Authenticated Transcript Protection:</strong> Only results marked{" "}
              <strong>PUBLISHED</strong> by School Administration are visible. In-progress or draft
              scores remain restricted.
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-300 bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-300 font-bold uppercase text-[10px]"
          >
            Strict RLS Active
          </Badge>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
              <p className="text-sm font-medium text-zinc-500">
                Retrieving official published marks...
              </p>
            </div>
          </div>
        ) : subjectResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950 space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              No Published Results Available
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
              Your results for the selected session and term have not been published by the academic
              board yet. Please check back after official release.
            </p>
          </div>
        ) : (
          <>
            {/* Terminal Performance KPI Overview Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Terminal Average
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">
                    {average}%
                  </span>
                  <span className="text-xs text-emerald-600 font-bold">
                    {average >= 70 ? "Excellent" : average >= 50 ? "Pass" : "Review"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Across {subjectResults.length} enrolled subjects
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Total Marks Obtained
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-700 dark:text-blue-400">
                    {totalScore}
                  </span>
                  <span className="text-xs text-zinc-400">/ {totalMax} Max</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">Continuous Assessment + Examination</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Grade Point Average (GPA)
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-700 dark:text-purple-400">
                    {gpa}
                  </span>
                  <span className="text-xs text-zinc-400">/ 4.0 Scale</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">Standardized Institutional GPA</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Cohort Rank
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {termSummary?.class_rank ? getRankSuffix(termSummary.class_rank) : "Evaluated"}
                  </span>
                  {termSummary?.class_size ? (
                    <span className="text-xs text-zinc-400">
                      in class of {termSummary.class_size}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-zinc-400">Based on terminal composite average</p>
              </div>
            </div>

            {/* Subject-by-Subject Result Breakdown Table */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Subject Performance Statement
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  Official Transcript
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <th className="py-3 px-4">Subject Name</th>
                      <th className="py-3 px-3 text-center">CA Score (40)</th>
                      <th className="py-3 px-3 text-center">Exam / CBT (60)</th>
                      <th className="py-3 px-3 text-center">Total Score (100)</th>
                      <th className="py-3 px-3 text-center">Grade</th>
                      <th className="py-3 px-3 text-center">GPA</th>
                      <th className="py-3 px-4">Teacher Remark</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {subjectResults.map((r) => {
                      const isPass = Number(r.total_score) >= 50;
                      return (
                        <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                            {r.subject?.name || "Subject"}
                            {r.subject?.code && (
                              <span className="ml-1.5 text-[10px] text-zinc-400 font-normal">
                                ({r.subject.code})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-zinc-700 dark:text-zinc-300">
                            {r.ca_score}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-zinc-700 dark:text-zinc-300">
                            {r.exam_score}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-sm text-zinc-900 dark:text-white">
                            {r.total_score}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                                r.grade === "A+" || r.grade === "A"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : r.grade === "B"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    : r.grade === "C"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : isPass
                                        ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-zinc-600 dark:text-zinc-400">
                            {r.gpa_point}
                          </td>
                          <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                            {r.teacher_remark || (isPass ? "Satisfactory" : "Needs Revision")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold uppercase"
                            >
                              PUBLISHED
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grading Scale Legend Footer */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
                Official Grading Key:
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-zinc-600 dark:text-zinc-400 text-[11px]">
                {gradingScales.map((s) => (
                  <div key={s.id} className="flex items-center gap-1">
                    <strong className="text-zinc-900 dark:text-white">{s.grade}</strong>
                    <span>
                      ({s.min_score}% - {s.max_score}%)
                    </span>
                    <span className="text-zinc-400">• {s.remark}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Report Card Modal */}
      {showReportCardModal && reportCardData && (
        <ReportCardView data={reportCardData} onClose={() => setShowReportCardModal(false)} />
      )}
    </PortalLayout>
  );
}
