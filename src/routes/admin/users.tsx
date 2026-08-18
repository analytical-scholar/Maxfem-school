// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — USER MANAGEMENT (PHASE 3)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Search,
  ShieldCheck,
  Filter,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { fetchUsers, updateUserRole, updateUserStatus } from "@/lib/school-service";
import type { Profile, UserRole, AccountStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { role: currentAdminRole, profile: currentAdminProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(
        search,
        roleFilter === "ALL" ? undefined : (roleFilter as UserRole),
        statusFilter === "ALL" ? undefined : (statusFilter as AccountStatus),
      );
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenEdit = (user: Profile) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedStatus(user.status);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    // Security check: only SUPER_ADMIN can promote to SUPER_ADMIN
    if (selectedRole === "SUPER_ADMIN" && currentAdminRole !== "SUPER_ADMIN") {
      toast.error("Security Restriction: Only SUPER_ADMIN can assign the SUPER_ADMIN role.");
      return;
    }

    // Security check: cannot modify own role
    if (editingUser.id === currentAdminProfile?.id && selectedRole !== editingUser.role) {
      toast.error("Security Restriction: You cannot alter your own assigned role.");
      return;
    }

    setSaving(true);
    try {
      if (selectedRole !== editingUser.role) {
        const resRole = await updateUserRole(editingUser.id, selectedRole, editingUser.role);
        if (!resRole.success) throw new Error(resRole.error);
      }

      if (selectedStatus !== editingUser.status) {
        const resStatus = await updateUserStatus(
          editingUser.id,
          selectedStatus,
          editingUser.status,
        );
        if (!resStatus.success) throw new Error(resStatus.error);
      }

      toast.success(`User ${editingUser.full_name} updated successfully.`);
      setEditingUser(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update user";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">SUPER_ADMIN</Badge>
        );
      case "ADMIN":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">ADMIN</Badge>;
      case "TEACHER":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">TEACHER</Badge>
        );
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">STUDENT</Badge>;
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="text-emerald-700 border-emerald-300">
            ACTIVE
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="text-amber-700 border-amber-300">
            PENDING
          </Badge>
        );
      case "SUSPENDED":
        return <Badge variant="destructive">SUSPENDED</Badge>;
      default:
        return <Badge variant="secondary">INACTIVE</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <PortalLayout
        title="User & Security Management"
        subtitle="Manage user profiles, account access, and institutional role authorizations"
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Users" }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        {/* Filters Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by full name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-36">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="TEACHER">TEACHER</SelectItem>
                  <SelectItem value="STUDENT">STUDENT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">User Details</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="size-5 animate-spin text-primary" />
                        <span>Loading user directory from Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Users className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                      <p className="font-semibold text-foreground">No users found matching query</p>
                      <p className="text-xs">Try clearing filters or search keywords.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{user.full_name}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                        {user.phone && (
                          <div className="text-[11px] text-muted-foreground">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-5 py-4">{getStatusBadge(user.status)}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(user)}
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                        >
                          <Edit2 className="mr-1 size-3.5" />
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Manage User Privileges & Access</DialogTitle>
              <DialogDescription className="text-xs">
                Update account status or role for{" "}
                <span className="font-semibold text-foreground">{editingUser?.full_name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1.5">
                  User Email (Immutable)
                </label>
                <Input value={editingUser?.email || ""} disabled className="bg-muted text-xs" />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1.5">
                  Assigned System Role
                </label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as UserRole)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">STUDENT (Access to Student Portal)</SelectItem>
                    <SelectItem value="TEACHER">TEACHER (Faculty & Classroom Access)</SelectItem>
                    <SelectItem value="ADMIN">ADMIN (Institutional Management)</SelectItem>
                    {currentAdminRole === "SUPER_ADMIN" && (
                      <SelectItem value="SUPER_ADMIN">
                        SUPER_ADMIN (Complete Master Access)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1.5">Account Status</label>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val as AccountStatus)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE (Full access permitted)</SelectItem>
                    <SelectItem value="PENDING">PENDING (Awaiting verification)</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED (Access locked by admin)</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE (Dormant profile)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border bg-surface p-3 text-[11px] text-muted-foreground">
                <Lock className="inline size-3.5 mr-1 text-primary" />
                All changes to roles or account status are immutably logged into PostgreSQL audit
                logs and audited by database triggers.
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveUser} disabled={saving}>
                {saving ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PortalLayout>
    </ProtectedRoute>
  );
}
