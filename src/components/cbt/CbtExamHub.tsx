// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — CBT EXAMINATION HUB (PHASE 5)
// ==============================================================================

import React, { useState, useEffect } from "react";
import {
  Laptop,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Edit2,
  Trash2,
  Users,
  Send,
  Lock,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  Examination,
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
  ExamStatus,
} from "@/types/database";
import {
  fetchExaminations,
  fetchClasses,
  fetchSubjects,
  fetchAcademicSessions,
  fetchTerms,
  publishExamination,
  deleteExamination,
} from "@/lib/school-service";
import { useAuth } from "@/lib/auth-context";
import { CbtExamFormModal } from "./CbtExamFormModal";
import { CbtQuestionManagerModal } from "./CbtQuestionManagerModal";
import { CbtExamMonitorModal } from "./CbtExamMonitorModal";
import { toast } from "sonner";

interface CbtExamHubProps {
  role: "ADMIN" | "SUPER_ADMIN" | "TEACHER";
  teacherProfileId?: string;
}

export function CbtExamHub({ role, teacherProfileId }: CbtExamHubProps) {
  const [exams, setExams] = useState<Examination[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Examination | null>(null);

  const [isQuestionManagerOpen, setIsQuestionManagerOpen] = useState(false);
  const [examForQuestions, setExamForQuestions] = useState<Examination | null>(null);

  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [examToMonitor, setExamToMonitor] = useState<Examination | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedExams, fetchedClasses, fetchedSubjects, fetchedSessions, fetchedTerms] =
        await Promise.all([
          fetchExaminations({
            status: statusFilter !== "ALL" ? (statusFilter as ExamStatus) : undefined,
            classId: classFilter !== "ALL" ? classFilter : undefined,
            subjectId: subjectFilter !== "ALL" ? subjectFilter : undefined,
            search: searchQuery || undefined,
            teacherProfileId: role === "TEACHER" ? teacherProfileId : undefined,
          }),
          fetchClasses(),
          fetchSubjects(),
          fetchAcademicSessions(),
          fetchTerms(),
        ]);

      setExams(fetchedExams);
      setClasses(fetchedClasses);
      setSubjects(fetchedSubjects);
      setSessions(fetchedSessions);
      setTerms(fetchedTerms);
    } catch (err) {
      console.error("[CbtExamHub] Error loading CBT data:", err);
      toast.error("Failed to load examinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, classFilter, subjectFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    setExamToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exam: Examination) => {
    setExamToEdit(exam);
    setIsFormOpen(true);
  };

  const handleOpenQuestions = (exam: Examination) => {
    setExamForQuestions(exam);
    setIsQuestionManagerOpen(true);
  };

  const handleOpenMonitor = (exam: Examination) => {
    setExamToMonitor(exam);
    setIsMonitorOpen(true);
  };

  const handleStatusChange = async (examId: string, newStatus: ExamStatus) => {
    try {
      const res = await publishExamination(examId, newStatus);
      if (!res.success) throw new Error(res.error);
      toast.success(`Exam status updated to ${newStatus}`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change exam status";
      toast.error(msg);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!window.confirm("Are you sure you want to delete this examination?")) return;
    try {
      const res = await deleteExamination(examId);
      if (!res.success) throw new Error(res.error);
      toast.success("Examination deleted successfully");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete examination";
      toast.error(msg);
    }
  };

  // KPIs
  const totalExamsCount = exams.length;
  const publishedCount = exams.filter(
    (e) => e.status === "PUBLISHED" || e.status === "ACTIVE",
  ).length;
  const draftCount = exams.filter((e) => e.status === "DRAFT").length;
  const totalAttemptsCount = exams.reduce((sum, e) => sum + (e.attempts_count || 0), 0);

  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">PUBLISHED</Badge>;
      case "ACTIVE":
        return (
          <Badge className="bg-blue-600 text-white hover:bg-blue-700 animate-pulse">
            ACTIVE NOW
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
            DRAFT
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
            CLOSED
          </Badge>
        );
      case "ARCHIVED":
        return (
          <Badge variant="secondary" className="text-slate-500">
            ARCHIVED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Laptop className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Computer-Based Testing (CBT) Hub
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Create examinations, author test questions, configure schedules, and monitor student
            submissions in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Examination
          </Button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Total Examinations</span>
            <Laptop className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalExamsCount}</p>
          <span className="text-[11px] text-slate-400">Created in system</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Published / Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{publishedCount}</p>
          <span className="text-[11px] text-slate-400">Open to students</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Draft Items</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
          <span className="text-[11px] text-slate-400">In authoring</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Student Attempts</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-700">{totalAttemptsCount}</p>
          <span className="text-[11px] text-slate-400">Recorded submissions</span>
        </div>
      </div>

      {/* CONTROLS & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search exam title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </form>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Class Filter */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subject Filter */}
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Subjects</SelectItem>
              {subjects.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* EXAMINATIONS LIST */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium">Loading CBT Examinations...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Laptop className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Examinations Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            No examinations match your current filters. Create a new test or adjust your search.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create First Examination
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const hasQuestions = (exam.questions_count || 0) > 0;
            return (
              <div
                key={exam.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-xs p-5 flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        {exam.subject?.name || "Subject"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {exam.title}
                      </h3>
                    </div>
                    {getStatusBadge(exam.status)}
                  </div>

                  {exam.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{exam.description}</p>
                  )}
                </div>

                {/* Exam Meta Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Target Class
                    </span>
                    <span className="font-semibold text-slate-800">
                      {exam.school_class?.name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Duration</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {exam.duration_minutes} Mins
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Questions</span>
                    <span className="font-semibold text-slate-800">
                      {exam.questions_count || 0} ({exam.total_marks || 0} pts)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Attempts</span>
                    <span className="font-semibold text-emerald-700">
                      {exam.attempts_count || 0} Taken
                    </span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenQuestions(exam)}
                      className="text-xs h-8 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      Questions ({exam.questions_count || 0})
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMonitor(exam)}
                      className="text-xs h-8 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                    >
                      <Activity className="w-3.5 h-3.5 mr-1.5" />
                      Monitor
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status Toggle Shortcut */}
                    {exam.status === "DRAFT" ? (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(exam.id, "PUBLISHED")}
                        disabled={!hasQuestions}
                        title={!hasQuestions ? "Add questions before publishing" : ""}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Publish
                      </Button>
                    ) : exam.status === "PUBLISHED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(exam.id, "CLOSED")}
                        className="text-xs h-8 text-slate-600"
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        Close
                      </Button>
                    ) : null}

                    {/* More Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                        >
                          <span className="sr-only">Open menu</span>
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuLabel>Exam Controls</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenEdit(exam)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" />
                          Edit Exam Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenQuestions(exam)}>
                          <BookOpen className="w-3.5 h-3.5 mr-2" />
                          Manage Questions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenMonitor(exam)}>
                          <Activity className="w-3.5 h-3.5 mr-2" />
                          Live Submissions Monitor
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleStatusChange(exam.id, "DRAFT")}>
                          Set to DRAFT
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(exam.id, "PUBLISHED")}>
                          Set to PUBLISHED
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(exam.id, "ACTIVE")}>
                          Set to ACTIVE NOW
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(exam.id, "CLOSED")}>
                          Set to CLOSED
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(exam.id, "ARCHIVED")}>
                          Set to ARCHIVED
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(exam.id)}
                          className="text-rose-600 focus:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete Examination
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <CbtExamFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        examToEdit={examToEdit}
        classes={classes}
        subjects={subjects}
        sessions={sessions}
        terms={terms}
      />

      <CbtQuestionManagerModal
        isOpen={isQuestionManagerOpen}
        onClose={() => setIsQuestionManagerOpen(false)}
        exam={examForQuestions}
        onQuestionsUpdated={loadData}
      />

      <CbtExamMonitorModal
        isOpen={isMonitorOpen}
        onClose={() => setIsMonitorOpen(false)}
        exam={examToMonitor}
      />
    </div>
  );
}
