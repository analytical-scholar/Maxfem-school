import React from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, LogOut, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { UserRole, AccountStatus } from "@/types/database";

interface UnauthorizedProps {
  requiredRole?: UserRole | UserRole[];
  currentRole?: UserRole | null;
  accountStatus?: AccountStatus | null;
}

export function Unauthorized({ requiredRole, currentRole, accountStatus }: UnauthorizedProps) {
  const { signOut } = useAuth();

  const isSuspended = accountStatus === "SUSPENDED";
  const isPending = accountStatus === "PENDING";
  const isInactive = accountStatus === "INACTIVE";

  const getRequiredRoleDisplay = () => {
    if (!requiredRole) return "Authorized Staff / Student";
    if (Array.isArray(requiredRole)) {
      return requiredRole.join(" or ");
    }
    return requiredRole;
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-card sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-8" aria-hidden="true" />
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground">
          {isSuspended
            ? "Account Suspended"
            : isPending
              ? "Account Pending Approval"
              : isInactive
                ? "Account Inactive"
                : "Access Restricted"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {isSuspended ? (
            "Your Maxfem portal account has been suspended by the school administration. Please contact the administrative office for assistance."
          ) : isPending ? (
            "Your portal account is currently awaiting administrative verification. You will receive an email once your role is activated."
          ) : isInactive ? (
            "Your account is inactive. Please contact the school ICT department to reactivate your portal access."
          ) : (
            <>
              You do not have the required permissions to access this portal area.
              <br />
              <span className="mt-2 inline-block rounded-md bg-secondary px-3 py-1 font-mono text-xs text-secondary-foreground">
                Required Role: {getRequiredRoleDisplay()}
              </span>
              {currentRole && (
                <span className="ml-2 mt-2 inline-block rounded-md bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
                  Your Role: {currentRole}
                </span>
              )}
            </>
          )}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="mr-2 size-4" />
              Return Home
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              signOut();
              window.location.href = "/login";
            }}
          >
            <LogOut className="mr-2 size-4" />
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
}
