import React, { useState } from "react";
import { AlertTriangle, History, X, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StudentSubjectResult, GradingScale } from "@/types/database";
import { applyResultCorrection, computeGrade } from "@/lib/school-service";
import { useAuth } from "@/lib/auth-context";

interface ResultCorrectionModalProps {
  result: StudentSubjectResult;
  gradingScales: GradingScale[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ResultCorrectionModal({
  result,
  gradingScales,
  onClose,
  onSuccess,
}: ResultCorrectionModalProps) {
  const { profile, role } = useAuth();
  const [caScore, setCaScore] = useState<number>(Number(result.ca_score) || 0);
  const [examScore, setExamScore] = useState<number>(Number(result.exam_score) || 0);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live preview calculation
  const safeCa = Math.max(0, Math.min(40, Number(caScore) || 0));
  const safeExam = Math.max(0, Math.min(70, Number(examScore) || 0));
  const newTotal = Math.min(100, safeCa + safeExam);
  const preview = computeGrade(newTotal, 100, gradingScales);

  const oldTotal = Number(result.total_score) || 0;
  const isChanged = safeCa !== Number(result.ca_score) || safeExam !== Number(result.exam_score);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg(
        "A mandatory justification reason is required for any academic result correction.",
      );
      return;
    }

    if (!isChanged) {
      setErrorMsg("No score changes detected. Please modify the CA or Exam score to proceed.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await applyResultCorrection(
        {
          subjectResultId: result.id,
          studentId: result.student_id,
          caScore: safeCa,
          examScore: safeExam,
          reason: reason.trim(),
        },
        profile?.id || "admin-actor",
        role || "ADMIN",
      );

      if (!res.success) {
        setErrorMsg(res.error || "Failed to apply result correction");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error during correction";
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Controlled Result Correction
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Audited modification of student academic record
              </p>
            </div>
          </div>
          <Button
            id="close-correction-modal-btn"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50/80 px-6 py-3 border-b border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-900/40">
          <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p>
              <strong className="font-semibold">Academic Integrity Notice:</strong> All changes
              create an immutable audit record containing previous scores, new values, justification
              reason, actor, and timestamp.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Student & Subject Details */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/50 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Student:</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {result.student?.last_name}, {result.student?.first_name} (
                {result.student?.admission_number})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Subject:</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {result.subject?.name} ({result.subject?.code})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Class & Session:</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {result.school_class?.name} • {result.academic_session?.name} ({result.term?.name})
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500">Current Lifecycle Status:</span>
              <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                {result.status}
              </Badge>
            </div>
          </div>

          {/* Current vs New Score Comparison Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="corr-ca-score"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                CA Score (Max 40)
              </Label>
              <Input
                id="corr-ca-score"
                type="number"
                min="0"
                max="40"
                step="0.5"
                value={caScore}
                onChange={(e) => setCaScore(parseFloat(e.target.value) || 0)}
                className="mt-1"
                required
              />
              <span className="text-[10px] text-zinc-400">Previous: {result.ca_score}</span>
            </div>

            <div>
              <Label
                htmlFor="corr-exam-score"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Exam Score (Max 70)
              </Label>
              <Input
                id="corr-exam-score"
                type="number"
                min="0"
                max="70"
                step="0.5"
                value={examScore}
                onChange={(e) => setExamScore(parseFloat(e.target.value) || 0)}
                className="mt-1"
                required
              />
              <span className="text-[10px] text-zinc-400">Previous: {result.exam_score}</span>
            </div>
          </div>

          {/* Live Outcome Comparison Box */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Recalculation Preview
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-500">Previous: </span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {oldTotal}% ({result.grade})
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
              <div>
                <span className="text-zinc-500">New Total: </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {newTotal}% ({preview.grade})
                </span>
              </div>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 text-right">
              GPA: {preview.gpaPoint} • Remark: {preview.remark}
            </div>
          </div>

          {/* Mandatory Justification Reason */}
          <div>
            <Label
              htmlFor="corr-reason"
              className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between"
            >
              <span>Mandatory Justification Reason *</span>
              <span className="text-[10px] font-normal text-rose-500">Required</span>
            </Label>
            <Textarea
              id="corr-reason"
              rows={3}
              placeholder="Provide a detailed administrative reason (e.g., 'Correction of recorded Continuous Assessment marks after remarking of project by Subject Head')."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 text-xs"
              required
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              id="submit-correction-btn"
              type="submit"
              size="sm"
              disabled={isSubmitting || !reason.trim() || !isChanged}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Applying & Auditing..." : "Commit Audited Correction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
