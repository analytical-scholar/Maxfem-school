import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookMarked,
  GraduationCap,
  MonitorCheck,
  ShieldCheck,
  ArrowRight,
  LogIn,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const upcoming = [
  {
    icon: GraduationCap,
    title: "Student Portal",
    body: "Timetables, assignments, and personal academic records with strict privacy protection.",
    to: "/login?portal=student",
    role: "STUDENT",
  },
  {
    icon: BookMarked,
    title: "Teacher Portal",
    body: "Class management, attendance, assigned subjects, and lesson resources.",
    to: "/login?portal=teacher",
    role: "TEACHER",
  },
  {
    icon: ShieldCheck,
    title: "Administrative Portal",
    body: "Institutional governance, academic sessions, enrollment history, and audit trails.",
    to: "/login?portal=admin",
    role: "ADMIN",
  },
  {
    icon: MonitorCheck,
    title: "CBT Examinations",
    body: "Secure computer-based testing foundation with instant submission and assessment integrity.",
    to: "/login?portal=student",
    role: "STUDENT",
  },
];

export const Route = createFileRoute("/student-portal")({
  head: () => ({
    meta: [
      { title: "Portals & Online Services — Maxfem International School" },
      {
        name: "description",
        content:
          "Secure portal access for Maxfem students, faculty, and administrators to access academic records and examinations.",
      },
      { property: "og:title", content: "Portals — Maxfem International School" },
      { property: "og:description", content: "Secure institutional portal gateway." },
      { property: "og:url", content: "/student-portal" },
    ],
    links: [{ rel: "canonical", href: "/student-portal" }],
  }),
  component: StudentPortal,
});

function StudentPortal() {
  const { isAuthenticated, role } = useAuth();

  const getDashboardLink = () => {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return "/admin/dashboard";
    if (role === "TEACHER") return "/teacher/dashboard";
    return "/student/dashboard";
  };

  return (
    <>
      <PageHeader
        eyebrow="Portals"
        title="Maxfem Institutional Portals"
        description="Unified authenticated access for students, teachers, and administrators. Powered by Supabase Auth, PostgreSQL RLS, and secure role-based access control."
      />

      <section className="section-y">
        <div className="container-page">
          {/* Quick Access Card */}
          <div className="mb-12 flex flex-col justify-between gap-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <span className="inline-block rounded-md bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                Phase 2 Security Active
              </span>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
                {isAuthenticated ? `Signed in as ${role}` : "Sign In to Your Portal"}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {isAuthenticated
                  ? "Your session is active. You can proceed directly to your assigned workspace."
                  : "Access your student timetable, submit assignments, manage classes, or perform administrative tasks."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg">
                  <Link to={getDashboardLink()}>
                    <span>Go to Dashboard</span>
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link to="/login">
                    <LogIn className="mr-2 size-4" />
                    <span>Sign In to Portal</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <SectionHeading
            eyebrow="Portal Modules"
            title="Institutional Access Areas"
            className="mb-12"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {upcoming.map((item) => (
              <article
                key={item.title}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40"
              >
                <div>
                  <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-between px-2">
                    <Link to={item.to}>
                      <span>Access {item.title}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Need assistance or login credentials?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Official login credentials and admission numbers are issued by the school
              administrative office. For credential retrieval or password assistance, please contact
              the ICT support desk.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/contact">Contact the School Office</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
