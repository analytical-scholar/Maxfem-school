import React, { useState, useEffect } from "react";
import { History, X, ShieldAlert, User, Calendar, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResultCorrection } from "@/types/database";
import { fetchResultCorrections } from "@/lib/school-service";

interface CorrectionAuditHistoryModalProps {
  subjectResultId?: string;
  studentId?: string;
  title?: string;
  onClose: () => void;
}

export function CorrectionAuditHistoryModal({
  subjectResultId,
  studentId,
  title = "Result Corrections & Audit History",
  onClose,
}: CorrectionAuditHistoryModalProps) {
  const [corrections, setCorrections] = useState<ResultCorrection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchResultCorrections(subjectResultId, studentId);
      setCorrections(data);
      setLoading(false);
    }
    loadData();
  }, [subjectResultId, studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Immutable chronological log of all academic score modifications
              </p>
            </div>
          </div>
          <Button
            id="close-audit-history-modal-btn"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              Loading immutable correction history...
            </div>
          ) : corrections.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <ShieldAlert className="h-10 w-10 mx-auto text-zinc-400" />
              <p className="text-sm font-medium">
                No corrections recorded for this academic record.
              </p>
              <p className="text-xs text-zinc-400">
                All marks remain as originally recorded and submitted.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {corrections.map((corr) => (
                <div
                  key={corr.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Score Correction
                      </Badge>
                      {corr.subject_result?.subject?.name && (
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {corr.subject_result.subject.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {new Date(corr.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Previous vs New Values */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        Original Value:
                      </span>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {corr.old_value}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        Corrected Value:
                      </span>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {corr.new_value}
                      </p>
                    </div>
                  </div>

                  {/* Justification Reason */}
                  <div>
                    <span className="font-semibold text-zinc-500">Justification: </span>
                    <span className="italic text-zinc-800 dark:text-zinc-200">"{corr.reason}"</span>
                  </div>

                  {/* Actor details */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>
                        Modified by:{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          {corr.actor?.full_name || "Admin"}
                        </strong>{" "}
                        ({corr.actor_role})
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      UUID: {corr.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 px-6 py-3 dark:border-zinc-800 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
