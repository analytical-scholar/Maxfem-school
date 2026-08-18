// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — STUDENT PROFILE (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, GraduationCap, Calendar, Phone, ShieldCheck, RefreshCw, Home } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchStudentPortalData,
  updateStudentSelfProfile,
  type StudentDashboardData,
} from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "Student Profile — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { profile } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetchStudentPortalData(profile.id);
      setData(res);
      setPhone(profile.phone || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    try {
      const res = await updateStudentSelfProfile(profile.id, { phone });
      if (!res.success) throw new Error(res.error);
      toast.success("Contact phone updated successfully.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update phone";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title="Student Bio & Official Record"
        subtitle="Review your admission credentials, personal biodata, and guardian details"
        breadcrumbs={[{ label: "Student", to: "/student/dashboard" }, { label: "Profile" }]}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Identity Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-primary font-display text-2xl font-bold">
                {data?.student?.first_name?.charAt(0) || "S"}
              </div>
              <CardTitle className="font-display text-xl mt-3">
                {data?.student?.first_name} {data?.student?.last_name}
              </CardTitle>
              <CardDescription className="text-xs font-mono">{profile?.email}</CardDescription>
              <div className="mt-2 flex justify-center gap-1.5">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                  Scholar
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  {data?.student?.admission_number || "MIS/STD"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 border-t border-border pt-4 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Class Arm:</span>
                <span className="font-semibold text-foreground">
                  {data?.currentEnrollment?.school_class?.name || "Enrolled"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Academic Status:</span>
                <span className="font-semibold text-emerald-600">
                  {data?.student?.status || "ACTIVE"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Admission Type:</span>
                <span className="font-semibold text-foreground">
                  {data?.student?.admission_status || "REGULAR"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Info Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-lg">Official Biodata</CardTitle>
              <CardDescription className="text-xs">
                Official student record stored in the Maxfem institutional registry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">First Name</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {data?.student?.first_name}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Last Name</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {data?.student?.last_name}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Middle / Other Names</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {data?.student?.other_name || "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Gender</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {data?.student?.gender || "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Date of Birth</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {data?.student?.date_of_birth || "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Admission Number</div>
                  <div className="font-mono font-bold text-primary mt-0.5">
                    {data?.student?.admission_number}
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div>
                <h4 className="font-semibold text-foreground mb-2 text-xs uppercase tracking-wider">
                  Parent / Guardian Information
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-[11px] text-muted-foreground">Guardian Full Name</div>
                    <div className="font-semibold text-foreground mt-0.5">
                      {data?.student?.guardian_name || "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-[11px] text-muted-foreground">Guardian Telephone</div>
                    <div className="font-semibold text-foreground mt-0.5">
                      {data?.student?.guardian_phone || "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3 sm:col-span-2">
                    <div className="text-[11px] text-muted-foreground">Guardian Email</div>
                    <div className="font-semibold text-foreground mt-0.5">
                      {data?.student?.guardian_email || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Phone Update */}
              <form onSubmit={handleSavePhone} className="border-t border-border pt-4">
                <div className="max-w-xs">
                  <label className="font-medium text-foreground block mb-1">
                    Student Phone Number
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="+234 800 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
