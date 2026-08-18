import React from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AcademicAnalytics } from "@/types/database";

interface AcademicAnalyticsTabProps {
  analytics: AcademicAnalytics;
  className?: string;
}

export function AcademicAnalyticsTab({ analytics, className }: AcademicAnalyticsTabProps) {
  const {
    totalStudents,
    evaluatedStudents,
    classAverage,
    highestAverage,
    lowestAverage,
    passRate,
    gradeDistribution,
    subjectAverages,
  } = analytics;

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Class Average Score
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {classAverage}%
            </span>
            <span className="text-xs text-zinc-400">Overall cohort</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>
              High: <strong className="text-zinc-800 dark:text-zinc-200">{highestAverage}%</strong>
            </span>
            <span>
              Low: <strong className="text-zinc-800 dark:text-zinc-200">{lowestAverage}%</strong>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Cohort Pass Rate (≥50%)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {passRate}%
            </span>
            <span className="text-xs text-zinc-400">of enrolled results</span>
          </div>
          <div className="mt-3">
            <Progress value={passRate} className="h-1.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Evaluated Students
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {evaluatedStudents}
            </span>
            <span className="text-xs text-zinc-400">students graded</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">Across active enrolled curriculum subjects</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Top Distinction Count
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {(gradeDistribution.find((g) => g.grade === "A+")?.count || 0) +
                (gradeDistribution.find((g) => g.grade === "A")?.count || 0)}
            </span>
            <span className="text-xs text-zinc-400">A+ & A awards</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">Outstanding academic mastery</p>
        </div>
      </div>

      {/* Grade Distribution Breakdown & Subject Averages Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grade Distribution Histogram */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-1">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Grade Distribution
            </h3>
            <span className="text-xs text-zinc-400">All Subjects</span>
          </div>

          <div className="mt-4 space-y-3">
            {gradeDistribution.map((item) => (
              <div key={item.grade} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-zinc-900 dark:text-white w-6">
                      {item.grade}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {item.remark}
                    </span>
                  </div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {item.count}{" "}
                    <span className="text-zinc-400 text-[10px]">({item.percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.grade === "A+" || item.grade === "A"
                        ? "bg-emerald-500"
                        : item.grade === "B"
                          ? "bg-blue-500"
                          : item.grade === "C"
                            ? "bg-amber-500"
                            : item.grade === "D" || item.grade === "E"
                              ? "bg-zinc-400"
                              : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject-by-Subject Analytics Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Subject Performance Metrics
            </h3>
            <span className="text-xs text-zinc-400">
              {subjectAverages.length} Evaluated Subjects
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-2 text-center">Average</th>
                  <th className="py-2.5 px-2 text-center">Highest</th>
                  <th className="py-2.5 px-2 text-center">Lowest</th>
                  <th className="py-2.5 px-2 text-center">Pass Rate</th>
                  <th className="py-2.5 px-2 text-center">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {subjectAverages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No subject performance data available for this selection.
                    </td>
                  </tr>
                ) : (
                  subjectAverages.map((sub) => (
                    <tr key={sub.subjectId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-white">
                        {sub.subjectName}{" "}
                        <span className="text-[10px] text-zinc-400 font-normal">
                          ({sub.subjectCode})
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400">
                        {sub.averageScore}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                        {sub.highestScore}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                        {sub.lowestScore}%
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            sub.passRate >= 70
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : sub.passRate >= 50
                                ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {sub.passRate}%
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-center text-zinc-500">{sub.studentCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
