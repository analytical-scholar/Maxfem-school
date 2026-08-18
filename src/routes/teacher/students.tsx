// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — TEACHER STUDENTS (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Search, RefreshCw, User, CheckCircle2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchTeacherStudents } from "@/lib/school-service";
import type { Student } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/teacher/students")({
  head: () => ({
    meta: [
      { title: "My Students — Maxfem Faculty Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherStudentsPage,
});

function TeacherStudentsPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetchTeacherStudents(profile.id);
      setStudents(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const adm = (s.admission_number || "").toLowerCase();
    return name.includes(query) || adm.includes(query);
  });

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <PortalLayout
        title="Students in My Classes"
        subtitle="Roster of enrolled students under your classroom instruction (Protected by RLS)"
        breadcrumbs={[{ label: "Teacher", to: "/teacher/dashboard" }, { label: "My Students" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        {/* Search */}
        <div className="mb-6 flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Admission No.</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Gender / DOB</th>
                  <th className="px-5 py-3.5">Admission Status</th>
                  <th className="px-5 py-3.5 text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      <span>Loading student roster...</span>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <GraduationCap className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No students found</p>
                      <p className="text-xs">
                        Students enrolled in your assigned classes will automatically appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-primary">
                        {s.admission_number}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">
                          {s.first_name} {s.other_name ? `${s.other_name} ` : ""}
                          {s.last_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{s.profile?.email}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <div>{s.gender || "—"}</div>
                        {s.date_of_birth && (
                          <div className="text-[11px]">DOB: {s.date_of_birth}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700"
                        >
                          {s.admission_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Badge
                          variant={s.status === "ACTIVE" ? "outline" : "secondary"}
                          className={
                            s.status === "ACTIVE" ? "border-emerald-300 text-emerald-700" : ""
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
}
