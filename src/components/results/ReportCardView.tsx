import React, { useRef } from "react";
import {
  Award,
  Printer,
  X,
  GraduationCap,
  Calendar,
  Layers,
  User,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StudentReportCardData } from "@/types/database";

interface ReportCardViewProps {
  data: StudentReportCardData;
  onClose?: () => void;
}

export function ReportCardView({ data, onClose }: ReportCardViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const {
    student,
    currentClass,
    academicSession,
    term,
    subjectResults,
    termSummary,
    gradingScales,
    school,
  } = data;

  const totalObtained =
    termSummary?.total_score_obtained ??
    subjectResults.reduce((acc, r) => acc + (Number(r.total_score) || 0), 0);
  const totalPossible = termSummary?.total_possible_score ?? subjectResults.length * 100;
  const average =
    termSummary?.average_score ??
    (subjectResults.length > 0 ? Number((totalObtained / subjectResults.length).toFixed(2)) : 0);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-2 sm:p-4 print:static print:p-0 print:bg-white">
      <div
        ref={reportRef}
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 dark:text-zinc-100 print:shadow-none print:max-w-none print:rounded-none print:w-full"
      >
        {/* Top Controls (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Official Terminal Report Sheet
            </h3>
            <Badge
              variant="outline"
              className="ml-2 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              Verified Transcript
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              id="print-report-card-btn"
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Printer className="h-4 w-4" />
              Print / Export PDF
            </Button>
            {onClose && (
              <Button
                id="close-report-card-btn"
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Printable Report Card Sheet Body */}
        <div className="p-6 sm:p-10 space-y-6 print:p-4 print:space-y-4">
          {/* Institutional Header */}
          <div className="border-b-2 border-zinc-900 pb-6 text-center dark:border-zinc-200 print:pb-4">
            <div className="flex items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-md print:border print:border-black">
                <GraduationCap className="h-9 w-9" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-emerald-950 dark:text-emerald-100 print:text-black">
                  {school.name}
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-zinc-700">
                  {school.motto}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 print:text-zinc-600">
                  {school.address} • Tel: {school.phone} • Email: {school.email}
                </p>
              </div>
            </div>

            <div className="mt-4 inline-block rounded-lg bg-zinc-100 px-6 py-1 text-xs font-bold uppercase tracking-widest text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 print:bg-zinc-100 print:text-black print:border print:border-zinc-300">
              Continuous Assessment & Terminal Examination Report
            </div>
          </div>

          {/* Scholar Information Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-4 print:bg-white print:border-zinc-400">
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Student Name:</span>
              <p className="font-bold text-zinc-900 dark:text-white print:text-black text-sm">
                {student.last_name}, {student.first_name} {student.other_name || ""}
              </p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Admission No:</span>
              <p className="font-bold text-emerald-800 dark:text-emerald-300 print:text-black text-sm">
                {student.admission_number}
              </p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Class / Arm:</span>
              <p className="font-semibold text-zinc-900 dark:text-white print:text-black">
                {currentClass.name}
              </p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Gender:</span>
              <p className="font-semibold text-zinc-900 dark:text-white print:text-black">
                {student.gender || "Not Specified"}
              </p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                Academic Session:
              </span>
              <p className="font-semibold text-zinc-900 dark:text-white print:text-black">
                {academicSession.name}
              </p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Term:</span>
              <p className="font-semibold text-zinc-900 dark:text-white print:text-black">
                {term.name}
              </p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Class Position:</span>
              <p className="font-bold text-zinc-900 dark:text-white print:text-black">
                {termSummary?.class_rank
                  ? `${getRankSuffix(termSummary.class_rank)} of ${termSummary.class_size}`
                  : "Evaluated"}
              </p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Status:</span>
              <div className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 print:text-black">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Official / Published</span>
              </div>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 print:border-zinc-400">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 text-zinc-700 font-bold uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 print:bg-zinc-200 print:text-black">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-2 text-center">CA (40)</th>
                  <th className="py-2.5 px-2 text-center">Exam (60)</th>
                  <th className="py-2.5 px-2 text-center">Total (100)</th>
                  <th className="py-2.5 px-2 text-center">Grade</th>
                  <th className="py-2.5 px-2 text-center">Class Avg</th>
                  <th className="py-2.5 px-2 text-center">Highest</th>
                  <th className="py-2.5 px-2 text-center">Lowest</th>
                  <th className="py-2.5 px-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 print:divide-zinc-300">
                {subjectResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-500">
                      No published subject results available for this term.
                    </td>
                  </tr>
                ) : (
                  subjectResults.map((res, index) => {
                    const isPass = Number(res.total_score) >= 50;
                    return (
                      <tr
                        key={res.id || index}
                        className={
                          index % 2 === 0
                            ? "bg-white dark:bg-zinc-950 print:bg-white"
                            : "bg-zinc-50/50 dark:bg-zinc-900/30 print:bg-zinc-50"
                        }
                      >
                        <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100 print:text-black">
                          {res.subject?.name || "Subject"}
                          {res.subject?.code && (
                            <span className="ml-1 text-[10px] text-zinc-400 print:text-zinc-600">
                              ({res.subject.code})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-medium text-zinc-700 dark:text-zinc-300 print:text-black">
                          {res.ca_score}
                        </td>
                        <td className="py-2 px-2 text-center font-medium text-zinc-700 dark:text-zinc-300 print:text-black">
                          {res.exam_score}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-zinc-900 dark:text-white print:text-black">
                          {res.total_score}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded font-black text-[11px] ${
                              res.grade === "A+" || res.grade === "A"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 print:text-black"
                                : res.grade === "B"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 print:text-black"
                                  : res.grade === "C"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 print:text-black"
                                    : isPass
                                      ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 print:text-black"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 print:text-black"
                            }`}
                          >
                            {res.grade}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center text-zinc-500 dark:text-zinc-400 print:text-zinc-700">
                          {res.subjectClassAverage ?? "-"}
                        </td>
                        <td className="py-2 px-2 text-center text-zinc-500 dark:text-zinc-400 print:text-zinc-700">
                          {res.subjectClassHighest ?? "-"}
                        </td>
                        <td className="py-2 px-2 text-center text-zinc-500 dark:text-zinc-400 print:text-zinc-700">
                          {res.subjectClassLowest ?? "-"}
                        </td>
                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 print:text-zinc-800">
                          {res.teacher_remark || (isPass ? "Satisfactory" : "Needs Improvement")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Academic Performance Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 print:bg-white print:border-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Marks Scored
              </span>
              <p className="mt-1 text-lg font-black text-zinc-900 dark:text-white print:text-black">
                {totalObtained}{" "}
                <span className="text-xs font-normal text-zinc-400">/ {totalPossible}</span>
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 print:bg-white print:border-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Terminal Average
              </span>
              <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-400 print:text-black">
                {average}%
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 print:bg-white print:border-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Grade Point Average (GPA)
              </span>
              <p className="mt-1 text-lg font-black text-blue-700 dark:text-blue-400 print:text-black">
                {gpa} <span className="text-xs font-normal text-zinc-400">/ 4.0</span>
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 print:bg-white print:border-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Class Position
              </span>
              <p className="mt-1 text-lg font-black text-purple-700 dark:text-purple-400 print:text-black">
                {termSummary?.class_rank ? getRankSuffix(termSummary.class_rank) : "Evaluated"}
              </p>
            </div>
          </div>

          {/* Qualitative Remarks & Sign-off */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 print:border-zinc-400">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 print:text-black">
                Class Teacher's Remark:
              </span>
              <p className="mt-1 italic text-zinc-600 dark:text-zinc-400 print:text-black min-h-[32px]">
                {termSummary?.teacher_remark ||
                  (average >= 75
                    ? "An outstanding performance this term! Demonstrates exceptional diligence and academic dedication."
                    : average >= 55
                      ? "Good effort shown across most subjects. Encourage consistent revision in weaker areas."
                      : "Needs more focus and structured study habits to reach full potential.")}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-2 text-[10px] text-zinc-400 dark:border-zinc-800">
                <span>Teacher Signature: __________________</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 print:border-zinc-400">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 print:text-black">
                Principal's Official Remark:
              </span>
              <p className="mt-1 italic text-zinc-600 dark:text-zinc-400 print:text-black min-h-[32px]">
                {termSummary?.principal_remark ||
                  (average >= 75
                    ? "Commendable academic achievement. Keep up this standard of excellence."
                    : "Promising progress. With continued diligence, higher honors can be achieved.")}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-2 text-[10px] text-zinc-400 dark:border-zinc-800">
                <span>Principal Signature: __________________</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 print:text-black">
                  <CheckCircle2 className="h-3 w-3" /> Maxfem Academic Seal
                </span>
              </div>
            </div>
          </div>

          {/* Grading Scale Legend */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[10px] dark:border-zinc-800 dark:bg-zinc-900/50 print:bg-white print:border-zinc-300">
            <span className="font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Grading Scale & Interpretation Key:
            </span>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-600 dark:text-zinc-400">
              {gradingScales.map((scale) => (
                <div key={scale.id} className="flex items-center gap-1">
                  <span className="font-bold text-zinc-900 dark:text-white print:text-black">
                    {scale.grade}:
                  </span>
                  <span>
                    {scale.min_score}% - {scale.max_score}% ({scale.remark})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
