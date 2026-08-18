// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT SUBJECTS (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, RefreshCw, Layers, Search } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchStudentPortalData, type StudentDashboardData } from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/subjects")({
  head: () => ({
    meta: [
      { title: "My Subjects — Maxfem Student Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentSubjectsPage,
});

function StudentSubjectsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetchStudentPortalData(profile.id);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const filteredSubjects = (data?.subjects || []).filter((s) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query);
  });

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title="My Curriculum Subjects"
        subtitle="Complete catalog of subjects registered for your grade level"
        breadcrumbs={[{ label: "Student", to: "/student/dashboard" }, { label: "My Subjects" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subjects by title or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
              <span>Loading subjects...</span>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-card">
              <BookOpen className="mx-auto size-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No subjects found</p>
              <p className="text-xs">No subjects match your search or have been registered yet.</p>
            </div>
          ) : (
            filteredSubjects.map((sub) => (
              <Card key={sub.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-800 font-mono"
                    >
                      {sub.code}
                    </Badge>
                    <Badge variant="secondary">{sub.department}</Badge>
                  </div>
                  <CardTitle className="font-display text-lg mt-2">{sub.name}</CardTitle>
                </CardHeader>
                <CardContent className="border-t border-border pt-3 text-xs text-muted-foreground">
                  <p>{sub.description || "Standard national and Cambridge curriculum syllabus."}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
