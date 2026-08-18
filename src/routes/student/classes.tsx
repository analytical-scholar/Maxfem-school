// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT CLASS (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, RefreshCw, Users, GraduationCap, Calendar, BookOpen } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchStudentPortalData, type StudentDashboardData } from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/classes")({
  head: () => ({
    meta: [{ title: "My Class — Maxfem Student Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: StudentClassPage,
});

function StudentClassPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const enr = data?.currentEnrollment;
  const cls = enr?.school_class;

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title="My Classroom Allocation"
        subtitle="Academic stream information, class arm, session dates, and enrollment status"
        breadcrumbs={[{ label: "Student", to: "/student/dashboard" }, { label: "My Class" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Class Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  Grade Level {cls?.grade_level || 7}
                </Badge>
                {cls?.arm && <Badge variant="secondary">Arm {cls.arm}</Badge>}
              </div>
              <CardTitle className="font-display text-xl mt-2">
                {cls?.name || "JSS 1 Gold"}
              </CardTitle>
              <CardDescription className="text-xs">
                Classroom stream enrolled for the active academic calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Academic Session:</span>
                <span className="font-semibold text-foreground">
                  {enr?.academic_session?.name || "2024/2025"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Active Term:</span>
                <span className="font-semibold text-foreground">
                  {enr?.term?.name || "Second Term"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Enrollment Status:</span>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-emerald-700"
                >
                  {enr?.status || "ACTIVE"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Academic Expectations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Academic Guidelines</CardTitle>
              <CardDescription className="text-xs">
                Expectations for scholars enrolled in {cls?.name || "this class"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                Scholars are expected to attend all subject lectures promptly, submit continuous
                assessment projects on schedule, and adhere strictly to the Maxfem Code of Conduct.
              </p>
              <div className="rounded-lg bg-surface p-3 border border-border">
                <span className="font-semibold text-foreground block mb-1">
                  Maxfem Core Values:
                </span>
                <span>Excellence • Integrity • Diligence • Discipline • Moral Uprightness</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
