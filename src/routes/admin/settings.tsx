// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ADMIN SETTINGS & SECURITY (PHASE 3)
// ==============================================================================

import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Database, Lock, Server, FileCheck, CheckCircle2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Institutional Settings & RBAC — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { role, profile } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="Institutional Governance & Security Core"
        subtitle="Review security architecture, Row Level Security policies, and audit triggers"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Settings" }]}
      >
        <div className="space-y-6">
          {/* Security Architecture Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle className="font-display text-lg">
                  Row Level Security & RBAC Enforcement
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                PostgreSQL table policies and security definer functions active on Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>public.profiles</span>
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                      RLS ACTIVE
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    Users can select and update their own profiles (excluding role and status).
                    Super admins have complete administrative override.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>public.students & public.teachers</span>
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                      RLS ACTIVE
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    Students can only query their own records. Teachers can view their own record
                    and students enrolled in their assigned classes.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>public.audit_logs</span>
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                      IMMUTABLE
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    Insert-only ledger for role modifications, privilege changes, and authentication
                    events. No updates or deletions permitted.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>trg_prevent_profile_escalation</span>
                    <Badge variant="outline" className="text-purple-700 border-purple-300">
                      TRIGGER ACTIVE
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    Database trigger blocks any non-super admin user from promoting themselves or
                    others to SUPER_ADMIN.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institutional Metadata Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="size-5 text-primary" />
                <CardTitle className="font-display text-lg">
                  School Information & Metadata
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Official institution credentials and contact parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Institution Name</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    Maxfem International School
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Motto</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    Excellence in Knowledge & Character
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Location</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    Maxfem Close, Off Old Airport Road, Jos, Plateau State, Nigeria
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Contact Email</div>
                  <div className="font-semibold text-foreground mt-0.5">info@maxfem.edu.ng</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
