import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  GraduationCap,
  BookMarked,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/types/database";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  portal: z.enum(["student", "teacher", "admin"]).optional(),
});

const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid school email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Portal Login — Maxfem International School" },
      {
        name: "description",
        content:
          "Sign in to the Maxfem International School portal for students, teachers, and administrators.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, portal } = useSearch({ from: "/login" });
  const { signIn, setMockSession, isMockActive, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [selectedPortal, setSelectedPortal] = useState<"student" | "teacher" | "admin">(
    portal || "student",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(values.email, values.password);

      if (error) {
        setErrorMessage(
          error.message || "Invalid login credentials. Please check your email and password.",
        );
        setIsSubmitting(false);
        return;
      }

      // Successful sign in -> redirect
      const target =
        redirect ||
        (selectedPortal === "admin"
          ? "/admin/dashboard"
          : selectedPortal === "teacher"
            ? "/teacher/dashboard"
            : "/student/dashboard");
      navigate({ to: target });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred during sign-in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTestLogin = (role: UserRole) => {
    setMockSession(role, "ACTIVE");
    const target =
      role === "SUPER_ADMIN" || role === "ADMIN"
        ? "/admin/dashboard"
        : role === "TEACHER"
          ? "/teacher/dashboard"
          : "/student/dashboard";
    navigate({ to: target });
  };

  return (
    <>
      <PageHeader
        eyebrow="Authentication"
        title="Maxfem School Portals"
        description="Unified secure access point for Students, Faculty Members, and Administrative Officers."
      />

      <section className="section-y">
        <div className="container-page max-w-4xl">
          {/* Portal Selector Tabs */}
          <div className="mb-8 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPortal("student")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                selectedPortal === "student"
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <GraduationCap className="size-6" />
              <div>
                <div className="font-display text-sm font-semibold">Student Portal</div>
                <div className="hidden text-xs opacity-75 sm:block">Academics & CBT</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPortal("teacher")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                selectedPortal === "teacher"
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <BookMarked className="size-6" />
              <div>
                <div className="font-display text-sm font-semibold">Teacher Portal</div>
                <div className="hidden text-xs opacity-75 sm:block">Classes & Grading</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPortal("admin")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                selectedPortal === "admin"
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <ShieldCheck className="size-6" />
              <div>
                <div className="font-display text-sm font-semibold">Admin Portal</div>
                <div className="hidden text-xs opacity-75 sm:block">Management & RLS</div>
              </div>
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            {/* Primary Login Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Sign in to {selectedPortal.charAt(0).toUpperCase() + selectedPortal.slice(1)}{" "}
                  Portal
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your official school credentials to access protected academic records.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Institutional Email / ID
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. user@maxfem.edu.ng"
                      className="pl-9"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>
                        Access {selectedPortal.charAt(0).toUpperCase() + selectedPortal.slice(1)}{" "}
                        Portal
                      </span>
                      <ArrowRight className="size-4" />
                    </div>
                  )}
                </Button>
              </form>
            </div>

            {/* Quick RBAC Role Testing & Verification Panel */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2 text-primary font-display font-semibold text-sm">
                  <Sparkles className="size-4" />
                  <span>Phase 2 RBAC Sandbox</span>
                </div>
                <h3 className="mt-2 font-display text-base font-bold text-foreground">
                  Quick Role Verification
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Click any role below to instantly verify protected route access, authorization
                  guards, and role-based views in the preview:
                </p>

                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-medium"
                    onClick={() => handleQuickTestLogin("SUPER_ADMIN")}
                  >
                    <ShieldCheck className="mr-2 size-4 text-purple-600" />
                    <span>
                      Test as <strong>SUPER_ADMIN</strong>
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-medium"
                    onClick={() => handleQuickTestLogin("ADMIN")}
                  >
                    <ShieldCheck className="mr-2 size-4 text-blue-600" />
                    <span>
                      Test as <strong>ADMIN</strong>
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-medium"
                    onClick={() => handleQuickTestLogin("TEACHER")}
                  >
                    <BookMarked className="mr-2 size-4 text-emerald-600" />
                    <span>
                      Test as <strong>TEACHER</strong>
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-medium"
                    onClick={() => handleQuickTestLogin("STUDENT")}
                  >
                    <GraduationCap className="mr-2 size-4 text-amber-600" />
                    <span>
                      Test as <strong>STUDENT</strong>
                    </span>
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-card p-3.5 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">Supabase Project</div>
                <div className="truncate font-mono text-[0.7rem] text-primary mt-0.5">
                  https://odvwyzwxlvbylpznbjkv.supabase.co
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 className="size-3.5" />
                  <span>Phase 2 Security & RLS active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
