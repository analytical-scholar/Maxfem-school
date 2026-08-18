import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

const schema = z.object({
  email: z.string().email("Please enter a valid school email address"),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Maxfem International School" },
      { name: "description", content: "Reset your Maxfem School Portal password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
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
      const { error } = await resetPassword(values.email);
      if (error) {
        setErrorMessage(error.message || "Unable to send password reset email.");
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
        eyebrow="Account Recovery"
        title="Reset Portal Password"
        description="We will send a secure password reset link to your registered school email."
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
                  Check your email
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  We have dispatched a password reset link. Please click the link inside the email
                  to set a new password.
                </p>
                <Button asChild className="mt-6 w-full">
                  <Link to="/login">Return to Login</Link>
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
                  <Label htmlFor="email" className="text-sm font-medium">
                    Registered School Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. yourname@maxfem.edu.ng"
                      className="pl-9"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? "Sending reset link..." : "Send Reset Instructions"}
                </Button>

                <div className="mt-4 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="mr-1 size-3.5" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
