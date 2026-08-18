// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TERM MANAGEMENT (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Plus, RefreshCw, CheckCircle2, Calendar } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchTerms,
  createTerm,
  setCurrentTerm,
  fetchAcademicSessions,
} from "@/lib/school-service";
import type { Term, AcademicSession, TermName } from "@/types/database";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/terms")({
  head: () => ({
    meta: [
      { title: "Academic Terms — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTermsPage,
});

function AdminTermsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("ALL");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    academic_session_id: "",
    name: "First Term" as TermName,
    start_date: "",
    end_date: "",
    is_current: false,
  });
  const [creating, setCreating] = useState(false);
  const [updatingCurrent, setUpdatingCurrent] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [termsData, sessionsData] = await Promise.all([
        fetchTerms(selectedSessionId === "ALL" ? undefined : selectedSessionId),
        fetchAcademicSessions(),
      ]);
      setTerms(termsData);
      setSessions(sessionsData);

      const curSession = sessionsData.find((s) => s.is_current) || sessionsData[0];
      if (curSession && !createForm.academic_session_id) {
        setCreateForm((prev) => ({ ...prev, academic_session_id: curSession.id }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load terms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSessionId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.academic_session_id || !createForm.start_date || !createForm.end_date) {
      toast.error("Please select a session and provide start/end dates.");
      return;
    }

    setCreating(true);
    try {
      const res = await createTerm({
        academic_session_id: createForm.academic_session_id,
        name: createForm.name,
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        is_current: createForm.is_current,
      });

      if (!res.success) throw new Error(res.error);

      toast.success(`${createForm.name} created successfully.`);
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create term";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleSetCurrent = async (termId: string, termName: string) => {
    setUpdatingCurrent(termId);
    try {
      const res = await setCurrentTerm(termId);
      if (!res.success) throw new Error(res.error);

      toast.success(`Active academic period updated to ${termName}.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to switch active term";
      toast.error(msg);
    } finally {
      setUpdatingCurrent(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Academic Terms & Calendars"
        subtitle="Manage term schedules (First, Second, and Third Term) across academic sessions"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Terms" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const cur = sessions.find((s) => s.is_current) || sessions[0];
                setCreateForm({
                  academic_session_id: cur?.id || "",
                  name: "First Term",
                  start_date: "",
                  end_date: "",
                  is_current: false,
                });
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" />
              Add Term
            </Button>
          </div>
        }
      >
        {/* Session Filter Bar */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <span className="text-xs text-muted-foreground font-medium">Filter by Session:</span>
          <div className="w-56">
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Academic Sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.is_current ? "(Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Terms Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Term Name</th>
                  <th className="px-5 py-3.5">Academic Session</th>
                  <th className="px-5 py-3.5">Start Date</th>
                  <th className="px-5 py-3.5">End Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      <span>Loading terms...</span>
                    </td>
                  </tr>
                ) : terms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Clock className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No terms found</p>
                      <p className="text-xs">Click "Add Term" to set up term dates.</p>
                    </td>
                  </tr>
                ) : (
                  terms.map((term) => (
                    <tr
                      key={term.id}
                      className={`hover:bg-surface/60 transition-colors ${
                        term.is_current ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-bold text-foreground">{term.name}</td>
                      <td className="px-5 py-4 text-muted-foreground font-mono">
                        {term.academic_session?.name || "Session"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{term.start_date}</td>
                      <td className="px-5 py-4 text-muted-foreground">{term.end_date}</td>
                      <td className="px-5 py-4">
                        {term.is_current ? (
                          <Badge className="bg-primary text-primary-foreground">
                            <CheckCircle2 className="mr-1 size-3" />
                            Active Term
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!term.is_current && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetCurrent(term.id, term.name)}
                            disabled={updatingCurrent === term.id}
                            className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                          >
                            {updatingCurrent === term.id ? "Setting..." : "Set as Current"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Term Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Add Academic Term</DialogTitle>
              <DialogDescription className="text-xs">
                Configure term dates for an academic session.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Academic Session *</label>
                <Select
                  value={createForm.academic_session_id}
                  onValueChange={(val) =>
                    setCreateForm({ ...createForm, academic_session_id: val })
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.is_current ? "(Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Term Name *</label>
                <Select
                  value={createForm.name}
                  onValueChange={(val) => setCreateForm({ ...createForm, name: val as TermName })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Start Date *</label>
                  <Input
                    required
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">End Date *</label>
                  <Input
                    required
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_term_current"
                  checked={createForm.is_current}
                  onChange={(e) => setCreateForm({ ...createForm, is_current: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                <label htmlFor="is_term_current" className="text-xs text-foreground cursor-pointer">
                  Set this as the active current term immediately
                </label>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Adding..." : "Add Term"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
