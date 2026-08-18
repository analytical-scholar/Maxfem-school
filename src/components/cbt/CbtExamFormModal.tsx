// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — CBT EXAM FORM MODAL (PHASE 5)
// ==============================================================================

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Laptop, Calendar, Clock, AlertCircle } from "lucide-react";
import type {
  Examination,
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
  ExamStatus,
} from "@/types/database";
import { createExamination, updateExamination } from "@/lib/school-service";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface CbtExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  examToEdit?: Examination | null;
  classes: SchoolClass[];
  subjects: Subject[];
  sessions: AcademicSession[];
  terms: Term[];
}

export function CbtExamFormModal({
  isOpen,
  onClose,
  onSuccess,
  examToEdit,
  classes,
  subjects,
  sessions,
  terms,
}: CbtExamFormModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject_id: "",
    class_id: "",
    academic_session_id: "",
    term_id: "",
    duration_minutes: 45,
    pass_mark: 50,
    start_time: "",
    end_time: "",
    status: "DRAFT" as ExamStatus,
    is_randomized: false,
  });

  useEffect(() => {
    if (examToEdit) {
      setForm({
        title: examToEdit.title || "",
        description: examToEdit.description || "",
        subject_id: examToEdit.subject_id || "",
        class_id: examToEdit.class_id || "",
        academic_session_id: examToEdit.academic_session_id || "",
        term_id: examToEdit.term_id || "",
        duration_minutes: examToEdit.duration_minutes || 45,
        pass_mark: examToEdit.pass_mark || 50,
        start_time: examToEdit.start_time ? examToEdit.start_time.slice(0, 16) : "",
        end_time: examToEdit.end_time ? examToEdit.end_time.slice(0, 16) : "",
        status: examToEdit.status || "DRAFT",
        is_randomized: examToEdit.is_randomized ?? false,
      });
    } else {
      setForm({
        title: "",
        description: "",
        subject_id: subjects[0]?.id || "",
        class_id: classes[0]?.id || "",
        academic_session_id: sessions[0]?.id || "",
        terms: terms[0]?.id || "",
        term_id: terms[0]?.id || "",
        duration_minutes: 45,
        pass_mark: 50,
        start_time: "",
        end_time: "",
        status: "DRAFT",
        is_randomized: false,
      });
    }
  }, [examToEdit, isOpen, classes, subjects, sessions, terms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Examination title is required");
      return;
    }
    if (!form.subject_id) {
      toast.error("Subject is required");
      return;
    }
    if (!form.class_id) {
      toast.error("Target class is required");
      return;
    }
    if (!form.academic_session_id) {
      toast.error("Academic session is required");
      return;
    }
    if (!form.term_id) {
      toast.error("Term is required");
      return;
    }
    if (!user?.id) {
      toast.error("You must be logged in to create an examination");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: form.title,
        description: form.description || null,
        subject_id: form.subject_id,
        class_id: form.class_id,
        academic_session_id: form.academic_session_id,
        term_id: form.term_id,
        duration_minutes: Number(form.duration_minutes) || 45,
        pass_mark: Number(form.pass_mark) || 50,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        status: form.status,
        is_randomized: form.is_randomized,
      };

      if (examToEdit) {
        const res = await updateExamination(examToEdit.id, payload);
        if (!res.success) throw new Error(res.error);
        toast.success("Examination updated successfully");
      } else {
        const res = await createExamination({
          ...payload,
          created_by: user.id,
        });
        if (!res.success) throw new Error(res.error);
        toast.success("Examination created successfully as DRAFT");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save examination";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {examToEdit ? "Edit Examination" : "Create New CBT Examination"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Configure examination details, duration, target class, and schedule.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <Label htmlFor="exam_title" className="text-xs font-semibold text-slate-700">
              Examination Title *
            </Label>
            <Input
              id="exam_title"
              placeholder="e.g., First Term Mid-Term Mathematics Test (JS 2)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="exam_desc" className="text-xs font-semibold text-slate-700">
              Instructions / Description
            </Label>
            <Textarea
              id="exam_desc"
              rows={2}
              placeholder="Instructions for students (e.g., Answer all questions. Each carries equal marks.)..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 resize-none"
            />
          </div>

          {/* Subject & Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Subject *</Label>
              <Select
                value={form.subject_id}
                onValueChange={(val) => setForm({ ...form, subject_id: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Target Class *</Label>
              <Select
                value={form.class_id}
                onValueChange={(val) => setForm({ ...form, class_id: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} (Grade {cls.grade_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session & Term */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Academic Session *</Label>
              <Select
                value={form.academic_session_id}
                onValueChange={(val) => setForm({ ...form, academic_session_id: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((ses) => (
                    <SelectItem key={ses.id} value={ses.id}>
                      {ses.name} {ses.is_current && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Term *</Label>
              <Select
                value={form.term_id}
                onValueChange={(val) => setForm({ ...form, term_id: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.is_current && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration & Pass Mark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="exam_duration"
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duration (Minutes) *
              </Label>
              <Input
                id="exam_duration"
                type="number"
                min="5"
                max="240"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: parseInt(e.target.value) || 45 })
                }
                className="mt-1"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Recommended: 30–60 minutes for standard tests.
              </p>
            </div>

            <div>
              <Label htmlFor="exam_passmark" className="text-xs font-semibold text-slate-700">
                Pass Mark (%) *
              </Label>
              <Input
                id="exam_passmark"
                type="number"
                min="1"
                max="100"
                value={form.pass_mark}
                onChange={(e) => setForm({ ...form, pass_mark: parseInt(e.target.value) || 50 })}
                className="mt-1"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Standard benchmark is 50%.</p>
            </div>
          </div>

          {/* Scheduling: Start & End Times */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Exam Schedule Window (Optional)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start_time" className="text-xs text-slate-600">
                  Open From (Date & Time)
                </Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="end_time" className="text-xs text-slate-600">
                  Closes At (Date & Time)
                </Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              If left blank, published examinations can be attempted immediately at any time.
            </p>
          </div>

          {/* Options & Status */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_randomized"
                checked={form.is_randomized}
                onCheckedChange={(checked) => setForm({ ...form, is_randomized: checked })}
              />
              <Label
                htmlFor="is_randomized"
                className="text-xs font-medium text-slate-700 cursor-pointer"
              >
                Shuffle Question Order for Students
              </Label>
            </div>

            {examToEdit && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-700">Status:</Label>
                <Select
                  value={form.status}
                  onValueChange={(val: ExamStatus) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Saving..." : examToEdit ? "Save Changes" : "Create Examination"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
