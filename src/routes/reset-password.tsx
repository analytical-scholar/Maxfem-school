import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Update Password — Maxfem International School" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(values.password);
      if (error) {
        setErrorMessage(error.message || "Failed to update password.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Set New Password"
        description="Choose a secure password for your Maxfem Portal account."
      />

      <section className="section-y">
        <div className="container-page max-w-lg">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            {isSuccess ? (
              <div className="text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-6" />
                </div>
                <h2 className="mt-4 font-display text-lg font-bold text-foreground">
                  Password Updated Successfully
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Your password has been changed. You may now sign in with your updated credentials.
                </p>
                <Button asChild className="mt-6 w-full">
                  <Link to="/login">Proceed to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <div>{errorMessage}</div>
                  </div>
                )}

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
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

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      {...register("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? "Updating password..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
