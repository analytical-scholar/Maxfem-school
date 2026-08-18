// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ADMIN CBT EXAMINATION HUB (PHASE 5)
// ==============================================================================

import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { CbtExamHub } from "@/components/cbt/CbtExamHub";

export const Route = createFileRoute("/admin/cbt")({
  head: () => ({
    meta: [
      { title: "CBT Examinations — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCbtPage,
});

function AdminCbtPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout>
        <CbtExamHub role="ADMIN" />
      </PortalLayout>
    </ProtectedRoute>
  );
}
