// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ADMISSION APPLICATION STATUS TRACKER (PHASE 4)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Building,
  GraduationCap,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApplicationByNumberAndEmail } from "@/lib/school-service";
import type { AdmissionApplication, ApplicationStatus } from "@/types/database";
import { toast } from "sonner";

export const Route = createFileRoute("/admissions/status")({
  head: () => ({
    meta: [
      { title: "Track Application Status — Maxfem International School" },
      {
        name: "description",
        content:
          "Check real-time status of your Maxfem International School admission application.",
      },
    ],
    links: [{ rel: "canonical", href: "/admissions/status" }],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      appNo: (search.appNo as string) || "",
      email: (search.email as string) || "",
    };
  },
  component: AdmissionsStatusPage,
});

function AdmissionsStatusPage() {
  const searchParams = useSearch({ from: "/admissions/status" });

  const [applicationNumber, setApplicationNumber] = useState(searchParams.appNo || "");
  const [email, setEmail] = useState(searchParams.email || "");
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<AdmissionApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performLookup = async (appNo: string, em: string) => {
    if (!appNo.trim() || !em.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const result = await fetchApplicationByNumberAndEmail(appNo, em);
      if (result) {
        setApplication(result);
      } else {
        setApplication(null);
        toast.error("No application found matching the provided reference number and email.");
      }
    } catch (err) {
      console.error("Error looking up application:", err);
      toast.error("Failed to check application status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.appNo && searchParams.email) {
      performLookup(searchParams.appNo, searchParams.email);
    }
  }, [searchParams.appNo, searchParams.email]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationNumber.trim() || !email.trim()) {
      toast.error("Please enter both Application Number and Email");
      return;
    }
    performLookup(applicationNumber, email);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-sm font-medium py-1 px-3">
            Approved
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-sm font-medium py-1 px-3">
            Under Committee Review
          </Badge>
        );
      case "VERIFICATION_REQUIRED":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-sm font-medium py-1 px-3">
            Verification Required
          </Badge>
        );
      case "WAITLISTED":
        return (
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-sm font-medium py-1 px-3">
            Waitlisted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 text-sm font-medium py-1 px-3">
            Not Admitted
          </Badge>
        );
      case "SUBMITTED":
      default:
        return (
          <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 text-sm font-medium py-1 px-3">
            Submitted & In Queue
          </Badge>
        );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admissions Tracker"
        title="Check Your Application Status"
        description="Enter your application reference number and contact email to track review progress."
      />

      <div className="section-y bg-surface">
        <div className="container-page max-w-3xl mx-auto space-y-8">
          {/* Lookup Form */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Find Application Record
              </CardTitle>
              <CardDescription>
                Provide the exact Application Number (e.g. APP/2025/1001) provided upon submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="appNo" className="text-xs font-semibold">
                      Application Reference Number *
                    </Label>
                    <Input
                      id="appNo"
                      value={applicationNumber}
                      onChange={(e) => setApplicationNumber(e.target.value)}
                      placeholder="e.g. APP/2025/1001"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Registered Contact Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="parent@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !applicationNumber.trim() || !email.trim()}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Checking Status...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Check Status
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results View */}
          {hasSearched && !loading && !application && (
            <Card className="border border-border/80 text-center py-12">
              <CardContent className="space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/60" />
                <h3 className="font-semibold text-foreground text-base">
                  No Matching Application Found
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Please verify that your Application Reference Number and Email are typed
                  correctly. If you recently applied, check your confirmation notes or contact our
                  Admissions Office.
                </p>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/contact">Contact Admissions Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {application && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              {/* Main Status Header Card */}
              <Card className="border border-border shadow-md overflow-hidden">
                <div className="p-6 bg-muted/20 border-b flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Ref: {application.application_number}
                    </span>
                    <h2 className="text-2xl font-bold text-foreground">
                      {application.first_name} {application.last_name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applying for: <strong>{application.desired_class?.name}</strong> •{" "}
                      {application.desired_academic_session?.name}
                    </p>
                  </div>
                  <div>{getStatusBadge(application.status)}</div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Status Banner Explanation */}
                  {application.status === "APPROVED" && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Congratulations! Admission Approved
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                        We are pleased to inform you that the admissions committee has approved this
                        application for <strong>{application.desired_class?.name}</strong>. Please
                        check your registered email for official acceptance documentation and
                        payment schedules.
                      </p>
                    </div>
                  )}

                  {application.status === "VERIFICATION_REQUIRED" && (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-base">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        Document Verification Required
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        The admissions committee has requested additional credential verification
                        (e.g. original birth certificate or latest school transcript). Please reach
                        out to the admissions office to complete this requirement.
                      </p>
                    </div>
                  )}

                  {application.status === "UNDER_REVIEW" && (
                    <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-base">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Application is Under Committee Review
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                        Your application and submitted records are currently being evaluated by the
                        academic placement committee. Decisions are typically finalized within 3-5
                        business days.
                      </p>
                    </div>
                  )}

                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 rounded-lg border bg-card/60">
                      <p className="text-xs text-muted-foreground">Candidate Gender</p>
                      <p className="text-sm font-medium text-foreground">{application.gender}</p>
                    </div>
                    <div className="p-3.5 rounded-lg border bg-card/60">
                      <p className="text-xs text-muted-foreground">Submission Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {application.submission_date
                          ? new Date(application.submission_date).toLocaleDateString()
                          : new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg border bg-card/60">
                      <p className="text-xs text-muted-foreground">Guardian Contact</p>
                      <p className="text-sm font-medium text-foreground">
                        {application.guardian_name} ({application.guardian_phone})
                      </p>
                    </div>
                  </div>

                  {/* Document Verification Status List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Uploaded Documents & Credentials
                    </h4>
                    {!application.documents || application.documents.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No digital documents were attached at time of submission.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {application.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">
                                {doc.document_type.replace(/_/g, " ")}
                              </span>
                              <span className="text-muted-foreground">({doc.file_name})</span>
                            </div>
                            {doc.is_verified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px]">
                                Verified
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground text-[10px]"
                              >
                                Received
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Assistance Box */}
              <div className="p-5 rounded-2xl border border-border bg-card text-center space-y-3">
                <h4 className="font-semibold text-foreground text-sm">
                  Have questions about this application?
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Our admissions office is available Monday through Friday, 8:00 AM – 4:00 PM to
                  assist with inquiries.
                </p>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/contact">Contact Admissions Office</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
