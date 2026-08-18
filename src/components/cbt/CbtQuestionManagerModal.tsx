// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — CBT QUESTION MANAGER MODAL (PHASE 5)
// ==============================================================================

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  Laptop,
} from "lucide-react";
import type {
  Examination,
  ExaminationQuestion,
  QuestionOption,
  QuestionType,
} from "@/types/database";
import {
  fetchExamQuestions,
  createExamQuestion,
  updateExamQuestion,
  deleteExamQuestion,
} from "@/lib/school-service";
import { toast } from "sonner";

interface CbtQuestionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Examination | null;
  onQuestionsUpdated: () => void;
}

export function CbtQuestionManagerModal({
  isOpen,
  onClose,
  exam,
  onQuestionsUpdated,
}: CbtQuestionManagerModalProps) {
  const [questions, setQuestions] = useState<ExaminationQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Question Form State
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [marks, setMarks] = useState<number>(1);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<
    Array<{ id?: string; option_text: string; is_correct: boolean }>
  >([
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ]);

  const loadQuestions = async () => {
    if (!exam) return;
    try {
      setLoading(true);
      const data = await fetchExamQuestions(exam.id);
      setQuestions(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && exam) {
      loadQuestions();
      setIsAddingNew(false);
      setEditingQuestionId(null);
    }
  }, [isOpen, exam?.id]);

  const resetForm = () => {
    setQuestionText("");
    setQuestionType("MULTIPLE_CHOICE");
    setMarks(1);
    setExplanation("");
    setOptions([
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ]);
    setIsAddingNew(false);
    setEditingQuestionId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAddingNew(true);
  };

  const handleStartEdit = (q: ExaminationQuestion) => {
    setEditingQuestionId(q.id);
    setIsAddingNew(false);
    setQuestionText(q.question_text);
    setQuestionType(q.question_type);
    setMarks(Number(q.marks) || 1);
    setExplanation(q.explanation || "");

    if (q.options && q.options.length > 0) {
      const sortedOptions = [...q.options].sort((a, b) => a.order_index - b.order_index);
      setOptions(
        sortedOptions.map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
        })),
      );
    } else if (q.question_type === "TRUE_FALSE") {
      setOptions([
        { option_text: "True", is_correct: true },
        { option_text: "False", is_correct: false },
      ]);
    } else {
      setOptions([
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ]);
    }
  };

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    if (newType === "TRUE_FALSE") {
      setOptions([
        { option_text: "True", is_correct: true },
        { option_text: "False", is_correct: false },
      ]);
    } else if (options.length < 4) {
      setOptions([
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ]);
    }
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].option_text = text;
    setOptions(updated);
  };

  const handleSetCorrectOption = (selectedIndex: number) => {
    const updated = options.map((opt, idx) => ({
      ...opt,
      is_correct: idx === selectedIndex,
    }));
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error("Maximum 6 options allowed");
      return;
    }
    setOptions([...options, { option_text: "", is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    const wasCorrect = options[index].is_correct;
    const filtered = options.filter((_, idx) => idx !== index);
    if (wasCorrect && filtered.length > 0) {
      filtered[0].is_correct = true;
    }
    setOptions(filtered);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    // Validate options
    const emptyOptions = options.some((opt) => !opt.option_text.trim());
    if (emptyOptions) {
      toast.error("Please fill in text for all options");
      return;
    }

    const hasCorrect = options.some((opt) => opt.is_correct);
    if (!hasCorrect) {
      toast.error("Please select which option is the correct answer");
      return;
    }

    try {
      setSaving(true);

      const optionsWithOrder = options.map((opt, idx) => ({
        id: opt.id,
        option_text: opt.option_text.trim(),
        is_correct: opt.is_correct,
        order_index: idx + 1,
      }));

      if (editingQuestionId) {
        const res = await updateExamQuestion(
          editingQuestionId,
          exam.id,
          {
            question_text: questionText.trim(),
            question_type: questionType,
            marks: Number(marks) || 1,
            explanation: explanation.trim() || null,
          },
          optionsWithOrder,
        );

        if (!res.success) throw new Error(res.error);
        toast.success("Question updated successfully");
      } else {
        const nextOrder = questions.length + 1;
        const res = await createExamQuestion(
          {
            examination_id: exam.id,
            question_text: questionText.trim(),
            question_type: questionType,
            marks: Number(marks) || 1,
            explanation: explanation.trim() || null,
            order_index: nextOrder,
          },
          optionsWithOrder,
        );

        if (!res.success) throw new Error(res.error);
        toast.success("Question added successfully");
      }

      resetForm();
      await loadQuestions();
      onQuestionsUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save question";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!exam) return;
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await deleteExamQuestion(questionId, exam.id);
      if (!res.success) throw new Error(res.error);
      toast.success("Question deleted");
      await loadQuestions();
      onQuestionsUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete question";
      toast.error(msg);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {exam?.title || "Examination Questions"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Author questions, set multiple-choice options, and configure scoring keys.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-slate-50">
                {questions.length} Questions
              </Badge>
              <Badge
                variant="outline"
                className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                {totalPoints} Total Marks
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Action Bar */}
          {!isAddingNew && !editingQuestionId && (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-600">
                <span>Manage test items. Student view will automatically shuffle if enabled.</span>
              </div>
              <Button
                onClick={handleStartAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </Button>
            </div>
          )}

          {/* ADD / EDIT QUESTION FORM */}
          {(isAddingNew || editingQuestionId) && (
            <div className="border-2 border-emerald-500/40 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="font-semibold text-sm text-slate-900">
                    {editingQuestionId
                      ? "Edit Question"
                      : `New Question (#${questions.length + 1})`}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-xs h-7 text-slate-500"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                {/* Question Type & Marks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Question Format</Label>
                    <Select
                      value={questionType}
                      onValueChange={(val: QuestionType) => handleTypeChange(val)}
                    >
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MULTIPLE_CHOICE">Multiple Choice (MCQ)</SelectItem>
                        <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="q_marks" className="text-xs font-semibold text-slate-700">
                      Points / Marks Awarded
                    </Label>
                    <Input
                      id="q_marks"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      value={marks}
                      onChange={(e) => setMarks(parseFloat(e.target.value) || 1)}
                      className="mt-1 h-9 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <Label htmlFor="q_text" className="text-xs font-semibold text-slate-700">
                    Question Stem / Statement *
                  </Label>
                  <Textarea
                    id="q_text"
                    rows={3}
                    placeholder="Enter question text clearly here..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="mt-1 text-sm resize-y"
                    required
                  />
                </div>

                {/* Options Section */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Answer Options (Select the Radio for Correct Answer) *
                    </Label>
                    {questionType === "MULTIPLE_CHOICE" && options.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        + Add Another Option
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx); // A, B, C, D...
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            opt.is_correct
                              ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="correct_option"
                            id={`opt_correct_${idx}`}
                            checked={opt.is_correct}
                            onChange={() => handleSetCorrectOption(idx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="w-6 text-xs font-bold text-slate-700">{letter}.</span>
                          <Input
                            placeholder={`Option ${letter} text...`}
                            value={opt.option_text}
                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                            className="h-8 text-xs bg-white"
                            disabled={questionType === "TRUE_FALSE"}
                            required
                          />
                          {opt.is_correct && (
                            <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 shrink-0">
                              Correct Key
                            </Badge>
                          )}
                          {questionType === "MULTIPLE_CHOICE" && options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOption(idx)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation (Optional) */}
                <div>
                  <Label htmlFor="q_explanation" className="text-xs font-semibold text-slate-700">
                    Teacher Solution / Explanation Note (Private to Teachers & Admins)
                  </Label>
                  <Textarea
                    id="q_explanation"
                    rows={2}
                    placeholder="Explanation notes will not be revealed to students during the active examination..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="mt-1 text-xs resize-none"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? "Saving..." : editingQuestionId ? "Update Question" : "Save Question"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* QUESTIONS LIST */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-xs">Loading questions...</p>
            </div>
          ) : questions.length === 0 && !isAddingNew ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h5 className="font-semibold text-sm text-slate-800">No Questions Added Yet</h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                This examination currently has 0 test questions. Click "Add Question" to begin
                authoring items.
              </p>
              <Button
                onClick={handleStartAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const sortedOpts = [...(q.options || [])].sort(
                  (a, b) => a.order_index - b.order_index,
                );
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900 leading-snug">
                            {q.question_text}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] text-slate-600 bg-slate-50"
                            >
                              {q.question_type === "TRUE_FALSE"
                                ? "True / False"
                                : "Multiple Choice"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200"
                            >
                              {q.marks} {Number(q.marks) === 1 ? "Mark" : "Marks"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(q)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {sortedOpts.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center gap-2 p-2 rounded-md text-xs border ${
                              opt.is_correct
                                ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 font-medium"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <span className="font-bold text-slate-500">{letter}.</span>
                            <span className="flex-1">{opt.option_text}</span>
                            {opt.is_correct && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                        <strong>Teacher Note:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
