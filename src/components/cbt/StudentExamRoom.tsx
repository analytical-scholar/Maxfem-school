// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — SECURE STUDENT CBT EXAM ROOM (PHASE 5)
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Laptop,
  HelpCircle,
  Award,
  Sparkles,
  ArrowLeft,
  ShieldAlert,
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
import type { Examination, ExaminationAttempt, SanitizedQuestion } from "@/types/database";
import {
  fetchStudentSanitizedQuestions,
  fetchStudentSavedAnswers,
  saveStudentAnswer,
  submitStudentExamAttempt,
} from "@/lib/school-service";
import { toast } from "sonner";

interface StudentExamRoomProps {
  exam: Examination;
  attempt: ExaminationAttempt;
  onFinished?: () => void;
}

export function StudentExamRoom({ exam, attempt, onFinished }: StudentExamRoomProps) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingAnswer, setSavingAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Submission & Results State
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    totalScore: number;
    maxScore: number;
    answeredCount: number;
    submittedAt: string;
  } | null>(null);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const started = new Date(attempt.started_at).getTime();
    const durationMs = (exam.duration_minutes || 45) * 60 * 1000;
    const expiry = started + durationMs;
    const now = Date.now();
    const left = Math.max(0, Math.floor((expiry - now) / 1000));
    return left;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmitted = useRef(false);

  // 1. Initial Load: Questions & Existing Answers
  useEffect(() => {
    async function loadExamRoom() {
      try {
        setLoading(true);
        const [sanitizedQs, savedAns] = await Promise.all([
          fetchStudentSanitizedQuestions(exam.id, attempt.id),
          fetchStudentSavedAnswers(attempt.id),
        ]);

        // If exam is randomized, shuffle questions deterministically or locally
        if (exam.is_randomized && sanitizedQs.length > 0) {
          // Shuffle question order for student
          const shuffled = [...sanitizedQs].sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
        } else {
          setQuestions(sanitizedQs);
        }

        setAnswers(savedAns);
      } catch (err) {
        console.error("[ExamRoom] Error loading test questions:", err);
        toast.error("Failed to load test questions");
      } finally {
        setLoading(false);
      }
    }

    loadExamRoom();
  }, [exam.id, attempt.id]);

  // 2. Countdown Timer
  useEffect(() => {
    if (submissionResult) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submissionResult]);

  const handleAutoSubmit = async () => {
    toast.error("Time has expired! Submitting your examination answers now...");
    await executeSubmission();
  };

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 3. Option Selection & Auto-Save
  const handleSelectOption = async (questionId: string, optionId: string) => {
    // Immediate optimistic local state update
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    try {
      setSavingAnswer(questionId);
      await saveStudentAnswer(attempt.id, questionId, optionId);
    } catch (err) {
      console.error("Error auto-saving answer:", err);
    } finally {
      setSavingAnswer(null);
    }
  };

  // 4. Final Submission
  const executeSubmission = async () => {
    try {
      setSubmitting(true);
      const res = await submitStudentExamAttempt(attempt.id);
      if (!res.success) throw new Error(res.error);

      setSubmissionResult({
        totalScore: res.totalScore ?? 0,
        maxScore: res.maxScore ?? exam.total_marks ?? 1,
        answeredCount: res.answeredCount ?? Object.keys(answers).length,
        submittedAt: res.submittedAt ?? new Date().toISOString(),
      });

      setIsSubmitConfirmOpen(false);
      toast.success("Examination submitted successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit exam";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Summary counts
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestionsCount = questions.length;
  const isUrgent = secondsRemaining < 300; // Under 5 mins

  // RENDER SUBMISSION RESULT VIEW
  if (submissionResult) {
    const percent = Math.round((submissionResult.totalScore / submissionResult.maxScore) * 100);
    const isPassed = percent >= (exam.pass_mark || 50);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-lg text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-emerald-600 text-white text-xs px-3 py-1">
              SUBMITTED & GRADED
            </Badge>
            <h2 className="text-2xl font-bold text-slate-900">{exam.title}</h2>
            <p className="text-sm text-slate-500">
              Your examination responses have been recorded and auto-evaluated securely.
            </p>
          </div>

          {/* Score Display Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 max-w-md mx-auto space-y-4">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Score
              </span>
              <div className="text-5xl font-black text-slate-900 mt-1">
                {submissionResult.totalScore}
                <span className="text-2xl font-semibold text-slate-400 ml-1">
                  / {submissionResult.maxScore}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block">Grade Percentage</span>
                <span
                  className={`font-bold text-sm ${isPassed ? "text-emerald-700" : "text-rose-700"}`}
                >
                  {percent}% ({isPassed ? "PASSED" : "FAILED"})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Pass Threshold</span>
                <span className="font-semibold text-slate-700">{exam.pass_mark}%</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => {
                if (onFinished) onFinished();
                else navigate({ to: "/student/exams" });
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 text-sm font-semibold rounded-xl"
            >
              Return to Examination Hub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER LOADING STATE
  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Preparing examination environment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 space-y-6">
      {/* EXAM TOP HEADER & LIVE TIMER */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-4 z-20 backdrop-blur-md bg-white/95">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 font-semibold">
              {exam.subject?.name || "Subject Test"}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              {exam.school_class?.name}
            </Badge>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{exam.title}</h1>
        </div>

        {/* Live Timer & Submit Button */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-base transition-colors ${
              isUrgent
                ? "bg-rose-100 text-rose-800 animate-pulse ring-2 ring-rose-400"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            <Clock className={`w-4 h-4 ${isUrgent ? "text-rose-600" : "text-slate-600"}`} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <Button
            onClick={() => setIsSubmitConfirmOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-xs"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Submit Test
          </Button>
        </div>
      </div>

      {/* MAIN EXAM STAGE & QUESTION PALETTE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* QUESTION DISPLAY PANEL (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {currentQuestion ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              {/* Question Index & Marks */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                    {currentIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    of {totalQuestionsCount} Questions
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {savingAnswer === currentQuestion.id && (
                    <span className="text-[11px] text-slate-400 italic">Saving answer...</span>
                  )}
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold bg-slate-50 text-slate-700"
                  >
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? "Mark" : "Marks"}
                  </Badge>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                {currentQuestion.question_text}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = answers[currentQuestion.id] === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl text-left text-sm font-medium transition-all border ${
                        isSelected
                          ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950 shadow-xs"
                          : "bg-slate-50/50 hover:bg-slate-100 border-slate-200 text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-white border border-slate-300 text-slate-600"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1">{opt.option_text}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Question Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="text-xs h-9"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {currentIndex < totalQuestionsCount - 1 ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(totalQuestionsCount - 1, prev + 1))
                    }
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 px-4"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsSubmitConfirmOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4"
                  >
                    Review & Submit
                    <Send className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <p className="text-slate-500 text-sm">
                No test questions available for this examination.
              </p>
            </div>
          )}
        </div>

        {/* QUESTION PALETTE DRAWER (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Question Palette</h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 w-full rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? "bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-1"
                        : isAnswered
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-200" />
                <span>Unanswered ({totalQuestionsCount - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-900" />
                <span>Current Question</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <Dialog open={isSubmitConfirmOpen} onOpenChange={setIsSubmitConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <Send className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Confirm Final Examination Submission
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to finalize your submission? Once submitted, you cannot change
              your answers.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Questions:</span>
              <span className="font-semibold text-slate-900">{totalQuestionsCount}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Answered:</span>
              <span>{answeredCount}</span>
            </div>
            <div className="flex justify-between text-amber-700 font-semibold">
              <span>Unanswered:</span>
              <span>{totalQuestionsCount - answeredCount}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60">
              <span>Time Remaining:</span>
              <span className="font-bold text-slate-900">{formatTime(secondsRemaining)}</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitConfirmOpen(false)}
              disabled={submitting}
            >
              Back to Test
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeSubmission}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Submitting..." : "Yes, Submit Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
