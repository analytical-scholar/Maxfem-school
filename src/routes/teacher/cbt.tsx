// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER CBT EXAM HUB (PHASE 5)
// ==============================================================================

import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { CbtExamHub } from "@/components/cbt/CbtExamHub";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/teacher/cbt")({
  head: () => ({
    meta: [
      { title: "Teacher CBT Examinations — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherCbtPage,
});

function TeacherCbtPage() {
  const { profile } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout>
        <CbtExamHub role="TEACHER" teacherProfileId={profile?.id} />
      </PortalLayout>
    </ProtectedRoute>
  );
}
