// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ACADEMIC SESSIONS (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Plus, RefreshCw, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchAcademicSessions,
  createAcademicSession,
  setCurrentAcademicSession,
} from "@/lib/school-service";
import type { AcademicSession } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/academic-sessions")({
  head: () => ({
    meta: [
      { title: "Academic Sessions — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAcademicSessionsPage,
});

function AdminAcademicSessionsPage() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });
  const [creating, setCreating] = useState(false);
  const [updatingCurrent, setUpdatingCurrent] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAcademicSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load academic sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.start_date || !createForm.end_date) {
      toast.error("Please fill in session name and dates.");
      return;
    }

    setCreating(true);
    try {
      const res = await createAcademicSession({
        name: createForm.name.trim(),
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        is_current: createForm.is_current,
      });

      if (!res.success) throw new Error(res.error);

      toast.success(`Academic Session ${createForm.name} created successfully.`);
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create session";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleSetCurrent = async (sessionId: string, sessionName: string) => {
    setUpdatingCurrent(sessionId);
    try {
      const res = await setCurrentAcademicSession(sessionId);
      if (!res.success) throw new Error(res.error);

      toast.success(`Active academic session switched to ${sessionName}.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set active session";
      toast.error(msg);
    } finally {
      setUpdatingCurrent(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Academic Sessions & Year Calendar"
        subtitle="Manage school academic years, term cycles, and the globally active session"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Academic Sessions" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const currentYear = new Date().getFullYear();
                setCreateForm({
                  name: `${currentYear}/${currentYear + 1}`,
                  start_date: `${currentYear}-09-01`,
                  end_date: `${currentYear + 1}-07-31`,
                  is_current: false,
                });
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" />
              Add Academic Session
            </Button>
          </div>
        }
      >
        {/* Sessions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-card">
              <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
              <span>Loading academic sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-card">
              <Calendar className="mx-auto size-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No academic sessions found</p>
              <p className="text-xs">Click "Add Academic Session" to initialize the calendar.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-card transition-all sm:flex-row sm:items-center ${
                  session.is_current
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-lg font-bold text-foreground">
                      Session: {session.name}
                    </span>
                    {session.is_current ? (
                      <Badge className="bg-primary text-primary-foreground">
                        <CheckCircle2 className="mr-1 size-3" />
                        Current Active Session
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Archive</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>
                      Duration: {session.start_date} to {session.end_date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!session.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetCurrent(session.id, session.name)}
                      disabled={updatingCurrent === session.id}
                      className="text-xs"
                    >
                      {updatingCurrent === session.id ? "Activating..." : "Set as Current Session"}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Session Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Add Academic Session</DialogTitle>
              <DialogDescription className="text-xs">
                Configure a new academic year calendar (e.g. 2025/2026).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Session Name *</label>
                <Input
                  required
                  placeholder="e.g. 2025/2026"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="text-xs font-mono font-medium"
                />
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
                  id="is_current"
                  checked={createForm.is_current}
                  onChange={(e) => setCreateForm({ ...createForm, is_current: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                <label htmlFor="is_current" className="text-xs text-foreground cursor-pointer">
                  Set this as the active session immediately
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
                  {creating ? "Creating..." : "Create Session"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
