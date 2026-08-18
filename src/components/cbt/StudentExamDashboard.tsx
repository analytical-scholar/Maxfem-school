// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT CBT EXAMINATION DASHBOARD (PHASE 5)
// ==============================================================================

import React, { useState, useEffect } from "react";
import {
  Laptop,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  Award,
  Calendar,
  Sparkles,
  HelpCircle,
} from "lucide-react";
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
import type { Examination, ExaminationAttempt } from "@/types/database";
import {
  fetchStudentEligibleExams,
  startStudentExamAttempt,
  type StudentEligibleExam,
} from "@/lib/school-service";
import { StudentExamRoom } from "./StudentExamRoom";
import { toast } from "sonner";

export function StudentExamDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState<StudentEligibleExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "AVAILABLE" | "COMPLETED">("ALL");

  // Active taking exam state
  const [activeTakingExam, setActiveTakingExam] = useState<{
    exam: Examination;
    attempt: ExaminationAttempt;
  } | null>(null);

  // Pre-exam instructions modal
  const [selectedExamForBrief, setSelectedExamForBrief] = useState<StudentEligibleExam | null>(
    null,
  );
  const [starting, setStarting] = useState(false);

  const loadExams = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await fetchStudentEligibleExams(user.id);
      setExams(data);
    } catch (err) {
      console.error("[StudentDashboard] Error loading exams:", err);
      toast.error("Failed to load your examinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [user?.id]);

  const handleStartExam = async (exam: StudentEligibleExam) => {
    if (!user?.id) return;

    try {
      setStarting(true);
      const res = await startStudentExamAttempt(exam.id, user.id);

      if (!res.success || !res.attempt) {
        throw new Error(res.error || "Unable to start exam attempt");
      }

      setSelectedExamForBrief(null);
      setActiveTakingExam({
        exam,
        attempt: res.attempt,
      });

      if (res.resumed) {
        toast.info("Resumed active examination in progress.");
      } else {
        toast.success("Examination started! Good luck.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start exam";
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  // If currently taking an exam, show the test room exclusively
  if (activeTakingExam) {
    return (
      <StudentExamRoom
        exam={activeTakingExam.exam}
        attempt={activeTakingExam.attempt}
        onFinished={() => {
          setActiveTakingExam(null);
          loadExams();
        }}
      />
    );
  }

  // Filtered exams
  const filteredExams = exams.filter((e) => {
    if (filter === "AVAILABLE") {
      return e.attemptStatus === "NOT_STARTED" || e.attemptStatus === "IN_PROGRESS";
    }
    if (filter === "COMPLETED") {
      return e.attemptStatus === "SUBMITTED" || e.attemptStatus === "EXPIRED";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-xs px-3 py-1">
            Student Testing Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Computer-Based Testing Center
          </h1>
          <p className="text-emerald-100/80 text-sm leading-relaxed">
            Access your scheduled tests, objective multiple-choice exams, and review auto-marked
            grade results.
          </p>
        </div>
      </div>

      {/* TABS & REFRESH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filter === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Exams ({exams.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("AVAILABLE")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filter === "AVAILABLE"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Available Now (
            {
              exams.filter(
                (e) => e.attemptStatus === "NOT_STARTED" || e.attemptStatus === "IN_PROGRESS",
              ).length
            }
            )
          </button>
          <button
            type="button"
            onClick={() => setFilter("COMPLETED")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filter === "COMPLETED"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed (
            {
              exams.filter((e) => e.attemptStatus === "SUBMITTED" || e.attemptStatus === "EXPIRED")
                .length
            }
            )
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadExams}
          disabled={loading}
          className="text-xs h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Exams
        </Button>
      </div>

      {/* EXAMS LIST */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium">Checking your eligible examinations...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Examinations Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no scheduled CBT examinations matching this view. Check back when
            teachers publish upcoming tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => {
            const attempt = exam.attempt;
            const isCompleted = exam.attemptStatus === "SUBMITTED";
            const isInProgress = exam.attemptStatus === "IN_PROGRESS";
            const isExpired = exam.attemptStatus === "EXPIRED";
            const notStarted = exam.attemptStatus === "NOT_STARTED";

            const score = attempt?.total_score ?? 0;
            const maxScore = attempt?.max_possible_score || exam.total_marks || 1;
            const percent = Math.round((score / maxScore) * 100);
            const isPassed = percent >= (exam.pass_mark || 50);

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs p-6 flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        {exam.subject?.name || "General Subject"}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {exam.title}
                      </h3>
                    </div>

                    {isCompleted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-semibold">
                        SUBMITTED
                      </Badge>
                    ) : isInProgress ? (
                      <Badge className="bg-amber-100 text-amber-800 border-0 text-xs font-semibold animate-pulse">
                        IN PROGRESS
                      </Badge>
                    ) : isExpired ? (
                      <Badge className="bg-rose-100 text-rose-800 border-0 text-xs font-semibold">
                        EXPIRED
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                        AVAILABLE
                      </Badge>
                    )}
                  </div>

                  {exam.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{exam.description}</p>
                  )}
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {exam.duration_minutes} Mins
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
                    <span className="font-semibold text-slate-800">
                      {exam.total_questions || "—"} ({exam.total_marks || 0} pts)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Pass Benchmark
                    </span>
                    <span className="font-semibold text-slate-800">{exam.pass_mark}%</span>
                  </div>
                </div>

                {/* Bottom Action or Results Panel */}
                <div className="pt-1">
                  {isCompleted ? (
                    <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800">
                            Final Grade
                          </span>
                          <p className="text-sm font-black text-slate-900">
                            {score} / {maxScore} pts ({percent}%)
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs font-bold ${
                          isPassed ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}
                      >
                        {isPassed ? "PASSED" : "NEEDS IMPROVEMENT"}
                      </Badge>
                    </div>
                  ) : isInProgress ? (
                    <Button
                      onClick={() => handleStartExam(exam)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-10 font-semibold rounded-xl"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Resume In-Progress Examination
                    </Button>
                  ) : isExpired ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                      Time limit elapsed without final submission.
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedExamForBrief(exam)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 font-semibold rounded-xl"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Take Examination
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRE-EXAM BRIEFING MODAL */}
      <Dialog
        open={Boolean(selectedExamForBrief)}
        onOpenChange={(open) => !open && setSelectedExamForBrief(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Examination Instructions & Rules
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Please review the following rules carefully before commencing your examination.
            </DialogDescription>
          </DialogHeader>

          {selectedExamForBrief && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-sm text-slate-900">{selectedExamForBrief.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <strong>Subject:</strong> {selectedExamForBrief.subject?.name}
                  </div>
                  <div>
                    <strong>Duration:</strong> {selectedExamForBrief.duration_minutes} Mins
                  </div>
                  <div>
                    <strong>Questions:</strong> {selectedExamForBrief.total_questions || "All"}
                  </div>
                  <div>
                    <strong>Total Marks:</strong> {selectedExamForBrief.total_marks || 0} pts
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-amber-900">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Examination Integrity Guidelines:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                  <li>Your timer begins immediately once you click "Start Test".</li>
                  <li>Answers are saved automatically as you select them.</li>
                  <li>When the countdown reaches 00:00, your exam will auto-submit.</li>
                  <li>Do not close or navigate away from the test window.</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedExamForBrief(null)}
              disabled={starting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => selectedExamForBrief && handleStartExam(selectedExamForBrief)}
              disabled={starting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {starting ? "Starting..." : "I Understand, Start Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
