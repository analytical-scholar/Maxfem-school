// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ADMIN INDEX (PHASE 3)
// ==============================================================================

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
});
