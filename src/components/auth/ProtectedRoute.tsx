import React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Unauthorized } from "./Unauthorized";
import type { UserRole } from "@/types/database";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role, status } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = routerState.location.pathname;
      navigate({
        to: "/login",
        search: { redirect: currentPath },
      });
    }
  }, [isLoading, isAuthenticated, navigate, routerState.location.pathname]);

  if (isLoading) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Verifying portal credentials & security permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Check account status
  if (status && status !== "ACTIVE") {
    return <Unauthorized accountStatus={status} currentRole={role} />;
  }

  // Check role permissions
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = role ? allowedRoles.includes(role) : false;
    if (!hasRole) {
      return <Unauthorized requiredRole={allowedRoles} currentRole={role} accountStatus={status} />;
    }
  }

  return <>{children}</>;
}
