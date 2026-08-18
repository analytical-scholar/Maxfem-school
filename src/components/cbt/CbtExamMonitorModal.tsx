// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — CBT EXAM MONITOR MODAL (PHASE 5)
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Award,
  TrendingUp,
} from "lucide-react";
import type { Examination, CbtMonitoringStats, ExaminationAttempt } from "@/types/database";
import { fetchCbtMonitoringStats } from "@/lib/school-service";
import { toast } from "sonner";

interface CbtExamMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Examination | null;
}

export function CbtExamMonitorModal({ isOpen, onClose, exam }: CbtExamMonitorModalProps) {
  const [stats, setStats] = useState<CbtMonitoringStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadStats = async () => {
    if (!exam) return;
    try {
      setLoading(true);
      const data = await fetchCbtMonitoringStats(exam.id);
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load live CBT metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && exam) {
      loadStats();
    }
  }, [isOpen, exam?.id]);

  const filteredAttempts =
    stats?.attempts.filter((att) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const student = att.student;
      const name = `${student?.first_name || ""} ${student?.last_name || ""}`.toLowerCase();
      const admNo = (student?.admission_number || "").toLowerCase();
      return name.includes(q) || admNo.includes(q);
    }) || [];

  // Calculate average score for submitted attempts
  const submittedAttempts = stats?.attempts.filter((a) => a.status === "SUBMITTED") || [];
  const averageScore =
    submittedAttempts.length > 0
      ? (
          submittedAttempts.reduce((acc, a) => acc + (a.total_score || 0), 0) /
          submittedAttempts.length
        ).toFixed(1)
      : "0";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Live Examination Monitor
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {exam?.title} — Class: {exam?.school_class?.name || "Target Class"}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={loading}
              className="text-xs h-8 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>Enrolled Class</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.totalEnrolled ?? 0}</p>
              <span className="text-[11px] text-slate-500">Eligible students</span>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between text-amber-700 text-xs font-medium mb-1">
                <span>In Progress</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-900">{stats?.totalInProgress ?? 0}</p>
              <span className="text-[11px] text-amber-700">Currently taking test</span>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-medium mb-1">
                <span>Submitted</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900">{stats?.totalSubmitted ?? 0}</p>
              <span className="text-[11px] text-emerald-700">Completed & Graded</span>
            </div>

            <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-medium mb-1">
                <span>Average Score</span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-indigo-900">
                {averageScore}
                <span className="text-sm font-normal text-indigo-600 ml-1">
                  / {exam?.total_marks || 0}
                </span>
              </p>
              <span className="text-[11px] text-indigo-700">Pass mark: {exam?.pass_mark}%</span>
            </div>
          </div>

          {/* ATTEMPTS TABLE */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-bold text-sm text-slate-800">
                Student Attempts ({filteredAttempts.length})
              </h4>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Filter student or admission no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs">Loading examination attempts...</p>
              </div>
            ) : filteredAttempts.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No attempts recorded yet.</p>
                <p className="text-[11px] text-slate-400">
                  When students start taking this test, live session tracking will appear here.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Admission No</th>
                      <th className="py-2.5 px-3">Started At</th>
                      <th className="py-2.5 px-3">Submitted At</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAttempts.map((att) => {
                      const studentName = att.student
                        ? `${att.student.first_name} ${att.student.last_name}`
                        : "Unknown Student";
                      const maxScore = att.max_possible_score || exam?.total_marks || 1;
                      const score = att.total_score ?? 0;
                      const percent = Math.round((score / maxScore) * 100);
                      const isPassed = percent >= (exam?.pass_mark || 50);

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900">{studentName}</td>
                          <td className="py-3 px-3 text-slate-600">
                            {att.student?.admission_number || "—"}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(att.started_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {att.submitted_at
                              ? new Date(att.submitted_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="py-3 px-3">
                            {att.status === "SUBMITTED" ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
                                Submitted
                              </Badge>
                            ) : att.status === "IN_PROGRESS" ? (
                              <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] animate-pulse">
                                In Progress
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-700 border-0 text-[10px]">
                                {att.status}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {att.status === "SUBMITTED" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-bold text-slate-900">
                                  {score}/{maxScore}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                    isPassed
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {percent}% ({isPassed ? "PASS" : "FAIL"})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
