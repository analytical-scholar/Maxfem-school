// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — SUBJECT MANAGEMENT (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus, RefreshCw, Edit2, Search, CheckCircle2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchSubjects, createSubject, updateSubject } from "@/lib/school-service";
import type { Subject } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/admin/subjects")({
  head: () => ({
    meta: [
      { title: "Subject Catalog — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSubjectsPage,
});

function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    department: "Sciences",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  // Edit Modal
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    department: "",
    description: "",
  });
  const [editing, setEditing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSubjects();
      setSubjects(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.code.trim() || !createForm.name.trim()) {
      toast.error("Subject code and name are required.");
      return;
    }

    setCreating(true);
    try {
      const res = await createSubject({
        code: createForm.code,
        name: createForm.name,
        department: createForm.department,
        description: createForm.description || undefined,
      });

      if (!res.success) throw new Error(res.error);

      toast.success(`Subject ${createForm.name} added successfully.`);
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create subject";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setEditForm({
      code: sub.code,
      name: sub.name,
      department: sub.department,
      description: sub.description || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    setEditing(true);
    try {
      const res = await updateSubject(editingSubject.id, {
        code: editForm.code,
        name: editForm.name,
        department: editForm.department,
        description: editForm.description || null,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Subject updated successfully.");
      setEditingSubject(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update subject";
      toast.error(msg);
    } finally {
      setEditing(false);
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesDept = deptFilter === "ALL" || s.department === deptFilter;
    const matchesSearch =
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Subject Curriculum & Course Catalog"
        subtitle="Manage academic subjects, codes, department categories, and course syllabi"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Subjects" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateForm({ code: "", name: "", department: "Sciences", description: "" });
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" />
              Add Subject
            </Button>
          </div>
        }
      >
        {/* Search & Filter */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by subject name or code (e.g. MTH101)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Department:</span>
            <div className="w-44">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  <SelectItem value="Sciences">Sciences</SelectItem>
                  <SelectItem value="Arts & Humanities">Arts & Humanities</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Languages">Languages</SelectItem>
                  <SelectItem value="Vocational & ICT">Vocational & ICT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Subject Name</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      <span>Loading subject catalog...</span>
                    </td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <BookOpen className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No subjects found</p>
                      <p className="text-xs">
                        Click "Add Subject" to create a new curriculum course.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-primary">{sub.code}</td>
                      <td className="px-5 py-4 font-semibold text-foreground">{sub.name}</td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-800"
                        >
                          {sub.department}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                        {sub.description || "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(sub)}
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                        >
                          <Edit2 className="mr-1 size-3.5" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Subject Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Subject</DialogTitle>
              <DialogDescription className="text-xs">
                Register a subject code and curriculum category into the academic database.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Subject Code *</label>
                  <Input
                    required
                    placeholder="e.g. MTH101 or BIO201"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Department</label>
                  <Select
                    value={createForm.department}
                    onValueChange={(val) => setCreateForm({ ...createForm, department: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sciences">Sciences</SelectItem>
                      <SelectItem value="Arts & Humanities">Arts & Humanities</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Languages">Languages</SelectItem>
                      <SelectItem value="Vocational & ICT">Vocational & ICT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Subject Name *</label>
                <Input
                  required
                  placeholder="e.g. Mathematics or General Chemistry"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Brief curriculum description or syllabus summary..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="text-xs resize-none"
                  rows={3}
                />
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
                  {creating ? "Adding Subject..." : "Add Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Subject Modal */}
        <Dialog
          open={Boolean(editingSubject)}
          onOpenChange={(open) => !open && setEditingSubject(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Subject</DialogTitle>
              <DialogDescription className="text-xs">
                Modify curriculum subject details for {editingSubject?.name}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Subject Code</label>
                  <Input
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Department</label>
                  <Input
                    required
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Subject Name</label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="text-xs resize-none"
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSubject(null)}
                  disabled={editing}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editing}>
                  {editing ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
