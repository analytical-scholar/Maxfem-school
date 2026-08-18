import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, User, LogOut, ShieldCheck, BookMarked, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mainNav, school } from "@/data/site";
import { useAuth } from "@/lib/auth-context";

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${school.name} — home`}>
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground"
      >
        M
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-[0.95rem] font-bold text-foreground">
          Maxfem
        </span>
        <span
          className={`block truncate text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground ${compact ? "hidden sm:block" : ""}`}
        >
          International School
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, role, profile, signOut } = useAuth();

  const getDashboardPath = () => {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return "/admin/dashboard";
    if (role === "TEACHER") return "/teacher/dashboard";
    return "/student/dashboard";
  };

  const getRoleIcon = () => {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return ShieldCheck;
    if (role === "TEACHER") return BookMarked;
    return GraduationCap;
  };

  const RoleIcon = getRoleIcon();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        <Wordmark compact />

        <nav aria-label="Primary" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "text-foreground bg-secondary" }}
                  inactiveProps={{ className: "text-muted-foreground" }}
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 font-medium">
                <Link to={getDashboardPath()}>
                  <RoleIcon className="size-4 text-primary" />
                  <span>{role} Portal</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/student-portal">Student Portal</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/admissions">Apply Now</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-background xl:hidden">
          <nav aria-label="Mobile" className="container-page py-4">
            <ul className="flex flex-col">
              {mainNav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    activeProps={{ className: "text-foreground" }}
                    inactiveProps={{ className: "text-muted-foreground" }}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border py-3.5 text-base font-medium transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-2 pb-2 sm:grid-cols-2">
              {isAuthenticated ? (
                <>
                  <Button asChild variant="default" onClick={() => setOpen(false)}>
                    <Link to={getDashboardPath()}>{role} Dashboard</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to="/student-portal">Student Portal</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/admissions">Apply Now</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
