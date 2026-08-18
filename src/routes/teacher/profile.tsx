// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER PROFILE (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Phone, ShieldCheck, CheckCircle2, RefreshCw, Building } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  fetchTeacherPortalData,
  updateTeacherProfile,
  type TeacherDashboardData,
} from "@/lib/school-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/profile")({
  head: () => ({
    meta: [
      { title: "Teacher Profile — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherProfilePage,
});

function TeacherProfilePage() {
  const { profile } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    qualification: "",
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetchTeacherPortalData(profile.id);
      setData(res);
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        qualification: res.teacher?.qualification || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !data?.teacher?.id) return;

    setSaving(true);
    try {
      const res = await updateTeacherProfile(profile.id, data.teacher.id, {
        full_name: form.full_name,
        phone: form.phone,
        qualification: form.qualification,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Profile details updated successfully.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title="Faculty Member Profile"
        subtitle="Manage your personal contact details, qualifications, and security credentials"
        breadcrumbs={[{ label: "Teacher", to: "/teacher/dashboard" }, { label: "Profile" }]}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Overview Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-primary font-display text-2xl font-bold">
                {profile?.full_name?.charAt(0) || "T"}
              </div>
              <CardTitle className="font-display text-xl mt-3">{profile?.full_name}</CardTitle>
              <CardDescription className="text-xs font-mono">{profile?.email}</CardDescription>
              <div className="mt-2 flex justify-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 bg-emerald-50"
                >
                  {profile?.role}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  {data?.teacher?.staff_id || "STAFF"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 border-t border-border pt-4 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-semibold text-foreground">
                  {data?.teacher?.department || "General"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Employment Date:</span>
                <span className="font-semibold text-foreground">
                  {data?.teacher?.employment_date || "Active"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-emerald-600">
                  {data?.teacher?.status || "ACTIVE"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Edit Information Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-lg">Personal & Contact Information</CardTitle>
              <CardDescription className="text-xs">
                Update your contact telephone and academic credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1">Full Name</label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Email Address</label>
                    <Input
                      disabled
                      value={profile?.email || ""}
                      className="text-xs bg-surface cursor-not-allowed"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Email managed via authentication system.
                    </span>
                  </div>
                  <div>
                    <label className="font-medium text-foreground block mb-1">Phone Number</label>
                    <Input
                      placeholder="+234 800 000 0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Academic Qualifications
                  </label>
                  <Input
                    placeholder="e.g. B.Sc. Ed (Mathematics), M.Ed, PGDE"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
