// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT CBT EXAMS ROUTE (PHASE 5)
// ==============================================================================

import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { StudentExamDashboard } from "@/components/cbt/StudentExamDashboard";

export const Route = createFileRoute("/student/exams")({
  head: () => ({
    meta: [
      { title: "My CBT Examinations — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentExamsPage,
});

function StudentExamsPage() {
  return (
    <ProtectedRoute allowedRoles={["STUDENT", "SUPER_ADMIN", "ADMIN", "TEACHER"]}>
      <PortalLayout>
        <StudentExamDashboard />
      </PortalLayout>
    </ProtectedRoute>
  );
}
