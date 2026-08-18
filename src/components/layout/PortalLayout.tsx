// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — AUTHENTICATED PORTAL LAYOUT
// ==============================================================================

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  Layers,
  Calendar,
  Clock,
  ClipboardList,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  BookMarked,
  User,
  School,
  ChevronRight,
  ExternalLink,
  Sparkles,
  UserPlus,
  FileQuestion,
  Laptop,
  Award,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  actions?: React.ReactNode;
}

export function PortalLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
}: PortalLayoutProps) {
  const { profile, role, signOut, isMockActive, setMockSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Define role-specific navigation menus
  const adminNavItems: NavItem[] = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Results & Analytics", to: "/admin/results", icon: Award },
    { label: "CBT Examinations", to: "/admin/cbt", icon: Laptop },
    { label: "Admissions", to: "/admin/admissions", icon: UserPlus },
    { label: "User Directory", to: "/admin/users", icon: Users },
    { label: "Students", to: "/admin/students", icon: GraduationCap },
    { label: "Teachers", to: "/admin/teachers", icon: Briefcase },
    { label: "Classes", to: "/admin/classes", icon: Layers },
    { label: "Subjects", to: "/admin/subjects", icon: BookOpen },
    { label: "Academic Sessions", to: "/admin/academic-sessions", icon: Calendar },
    { label: "Terms", to: "/admin/terms", icon: Clock },
    { label: "Student Enrollments", to: "/admin/enrollments", icon: ClipboardList },
    { label: "Teacher Assignments", to: "/admin/teacher-assignments", icon: UserCheck },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ];

  const teacherNavItems: NavItem[] = [
    { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "Results & Grading", to: "/teacher/results", icon: Award },
    { label: "CBT Exams", to: "/teacher/cbt", icon: Laptop },
    { label: "My Classes", to: "/teacher/classes", icon: Layers },
    { label: "My Subjects", to: "/teacher/subjects", icon: BookOpen },
    { label: "My Students", to: "/teacher/students", icon: GraduationCap },
    { label: "My Profile", to: "/teacher/profile", icon: User },
  ];

  const studentNavItems: NavItem[] = [
    { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Results & Reports", to: "/student/results", icon: Award },
    { label: "CBT Examinations", to: "/student/exams", icon: Laptop },
    { label: "My Profile", to: "/student/profile", icon: User },
    { label: "My Class", to: "/student/class", icon: Layers },
    { label: "My Subjects", to: "/student/subjects", icon: BookOpen },
    { label: "Academic Information", to: "/student/academic", icon: ClipboardList },
    { label: "Settings", to: "/student/settings", icon: Settings },
  ];

  const getNavItems = (): NavItem[] => {
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      return adminNavItems;
    }
    if (role === "TEACHER") {
      return teacherNavItems;
    }
    return studentNavItems;
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <ShieldCheck className="mr-1 size-3.5" />
            Super Admin
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          >
            <ShieldCheck className="mr-1 size-3.5" />
            Admin
          </Badge>
        );
      case "TEACHER":
        return (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <BookMarked className="mr-1 size-3.5" />
            Faculty
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <GraduationCap className="mr-1 size-3.5" />
            Student
          </Badge>
        );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold leading-tight text-foreground">
                Maxfem School
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                Institutional Portal
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-surface lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* User Identity Card in Sidebar */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <Avatar className="size-10 border border-border">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">
                {profile?.full_name || "User"}
              </span>
              <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
              <div className="mt-1">{getRoleBadge()}</div>
            </div>
          </div>

          {/* Quick Demo Switcher when active */}
          {isMockActive && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs dark:bg-amber-950/30">
              <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3" /> Demo Preview Active
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMockSession("ADMIN")}
                  className={`rounded px-1.5 py-1 font-medium transition ${
                    role === "ADMIN"
                      ? "bg-blue-600 text-white"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setMockSession("TEACHER")}
                  className={`rounded px-1.5 py-1 font-medium transition ${
                    role === "TEACHER"
                      ? "bg-emerald-600 text-white"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setMockSession("STUDENT")}
                  className={`rounded px-1.5 py-1 font-medium transition ${
                    role === "STUDENT"
                      ? "bg-amber-600 text-white"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setMockSession("SUPER_ADMIN")}
                  className={`rounded px-1.5 py-1 font-medium transition ${
                    role === "SUPER_ADMIN"
                      ? "bg-purple-600 text-white"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground hover:bg-surface hover:text-primary"
                }`}
              >
                <Icon
                  className={`size-4.5 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground"
          >
            <Link to="/" target="_blank">
              <ExternalLink className="mr-2 size-3.5" />
              Visit Public Website
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="mr-2 size-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-surface lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar navigation"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link to={navItems[0]?.to || "/"} className="hover:text-foreground">
                  Portal
                </Link>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.label}>
                    <ChevronRight className="size-3 text-muted-foreground/60" />
                    {crumb.to ? (
                      <Link to={crumb.to} className="hover:text-foreground">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : (
              <span className="font-display text-sm font-semibold text-foreground">
                Maxfem Institutional Workspace
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-destructive"
            >
              <LogOut className="mr-1.5 size-3.5" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {/* Page Heading */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          {/* Render Page Children */}
          {children}
        </main>
      </div>
    </div>
  );
}
