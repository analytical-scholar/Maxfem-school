// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER SUBJECTS (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, RefreshCw, Layers } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchTeacherPortalData, type TeacherDashboardData } from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/teacher/subjects")({
  head: () => ({
    meta: [
      { title: "My Subjects — Maxfem Faculty Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherSubjectsPage,
});

function TeacherSubjectsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetchTeacherPortalData(profile.id);
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

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title="My Curriculum Subjects"
        subtitle="Course syllabi and academic subjects assigned to your teaching portfolio"
        breadcrumbs={[{ label: "Teacher", to: "/teacher/dashboard" }, { label: "My Subjects" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
              <span>Loading assigned subjects...</span>
            </div>
          ) : !data?.assignedSubjects || data.assignedSubjects.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-card">
              <BookOpen className="mx-auto size-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No subjects allocated</p>
              <p className="text-xs">
                Contact the administration to allocate subjects to your faculty account.
              </p>
            </div>
          ) : (
            data.assignedSubjects.map((sub) => {
              // Find matching class assignments
              const matchingAssignments = data.assignments.filter((a) => a.subject_id === sub.id);
              return (
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
                    {sub.description && (
                      <p className="text-xs text-muted-foreground mt-1">{sub.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="border-t border-border pt-4 text-xs">
                    <div className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Layers className="size-3.5 text-primary" />
                      Assigned Class Streams:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchingAssignments.length > 0 ? (
                        matchingAssignments.map((ma) => (
                          <Badge key={ma.id} variant="outline" className="text-[11px]">
                            {ma.school_class?.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          All assigned classes
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
