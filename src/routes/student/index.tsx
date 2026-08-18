// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT INDEX (PHASE 3)
// ==============================================================================

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/")({
  beforeLoad: () => {
    throw redirect({ to: "/student/dashboard" });
  },
});
