// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — ONLINE ADMISSION APPLICATION (PHASE 4)
// ==============================================================================

import React, { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  UserPlus,
  CheckCircle2,
  Upload,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  User,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchClasses,
  fetchAcademicSessions,
  createApplication,
  uploadApplicationDocument,
  type SchoolClassWithCount,
} from "@/lib/school-service";
import type { AcademicSession, Gender, AdmissionDocType } from "@/types/database";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admissions/apply")({
  head: () => ({
    meta: [
      { title: "Apply for Admission — Maxfem International School" },
      {
        name: "description",
        content: "Submit an online application for admission to Maxfem International School.",
      },
    ],
    links: [{ rel: "canonical", href: "/admissions/apply" }],
  }),
  component: AdmissionsApplyPage,
});

function AdmissionsApplyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classes, setClasses] = useState<SchoolClassWithCount[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<{
    application_number: string;
    email: string;
    first_name: string;
    last_name: string;
    desired_class_name?: string;
  } | null>(null);
  const [copiedAppNo, setCopiedAppNo] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    other_name: "",
    date_of_birth: "",
    gender: "MALE" as Gender,
    email: user?.email || "",
    phone: "",
    address: "",
    guardian_name: "",
    guardian_relationship: "Parent",
    guardian_phone: "",
    guardian_email: "",
    previous_school: "",
    previous_class: "",
    previous_grade_average: "",
    desired_class_id: "",
    desired_academic_session_id: "",
  });

  // Files state
  const [birthCertFile, setBirthCertFile] = useState<File | null>(null);
  const [reportCardFile, setReportCardFile] = useState<File | null>(null);
  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    async function loadFormMetadata() {
      try {
        const [classesData, sessionsData] = await Promise.all([
          fetchClasses(),
          fetchAcademicSessions(),
        ]);
        setClasses(classesData);
        setSessions(sessionsData);

        const currentSession = sessionsData.find((s) => s.is_current) || sessionsData[0];
        if (currentSession) {
          setFormData((prev) => ({
            ...prev,
            desired_academic_session_id: currentSession.id,
          }));
        }
        if (classesData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            desired_class_id: classesData[0].id,
          }));
        }
      } catch (err) {
        console.error("Error loading application metadata:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadFormMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast.error("Please confirm that the provided information is true and accurate");
      return;
    }

    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.date_of_birth ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.guardian_name.trim() ||
      !formData.guardian_phone.trim() ||
      !formData.desired_class_id ||
      !formData.desired_academic_session_id
    ) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Application
      const res = await createApplication({
        ...formData,
        applicant_profile_id: user?.id,
        status: "SUBMITTED",
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to submit admission application");
        setSubmitting(false);
        return;
      }

      const createdApp = res.data;

      // 2. Upload attached documents concurrently if provided
      const uploadPromises: Promise<unknown>[] = [];
      if (birthCertFile) {
        uploadPromises.push(
          uploadApplicationDocument(createdApp.id, "BIRTH_CERTIFICATE", birthCertFile),
        );
      }
      if (reportCardFile) {
        uploadPromises.push(
          uploadApplicationDocument(createdApp.id, "PREVIOUS_REPORT_CARD", reportCardFile),
        );
      }
      if (passportPhotoFile) {
        uploadPromises.push(
          uploadApplicationDocument(createdApp.id, "PASSPORT_PHOTO", passportPhotoFile),
        );
      }

      if (uploadPromises.length > 0) {
        await Promise.allSettled(uploadPromises);
      }

      const selectedClass = classes.find((c) => c.id === formData.desired_class_id);

      setSubmittedApp({
        application_number: createdApp.application_number,
        email: createdApp.email,
        first_name: createdApp.first_name,
        last_name: createdApp.last_name,
        desired_class_name: selectedClass?.name,
      });

      toast.success("Application submitted successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected submission error";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyAppNumber = () => {
    if (!submittedApp) return;
    navigator.clipboard.writeText(submittedApp.application_number);
    setCopiedAppNo(true);
    toast.success("Application number copied to clipboard");
    setTimeout(() => setCopiedAppNo(false), 2500);
  };

  // If submitted successfully, show Confirmation Screen
  if (submittedApp) {
    return (
      <>
        <PageHeader
          eyebrow="Application Submitted"
          title="Admission Application Received!"
          description="Your application has been logged into the Maxfem Admissions Management System."
        />

        <div className="section-y bg-surface">
          <div className="container-page max-w-2xl mx-auto">
            <div className="p-8 rounded-2xl border border-border bg-card shadow-lg text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Thank You, {submittedApp.first_name}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your admission request for{" "}
                  <strong className="text-foreground">
                    {submittedApp.desired_class_name || "selected class"}
                  </strong>{" "}
                  has been submitted for review.
                </p>
              </div>

              {/* Application Number Box */}
              <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Official Application Reference Number
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-primary">
                    {submittedApp.application_number}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyAppNumber}
                    className="h-8 gap-1 text-xs"
                  >
                    {copiedAppNo ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please save or screenshot this number. You will need it and your email (
                  <span className="font-medium text-foreground">{submittedApp.email}</span>) to
                  track your application status.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button asChild className="w-full sm:w-auto gap-2">
                  <Link
                    to="/admissions/status"
                    search={{
                      appNo: submittedApp.application_number,
                      email: submittedApp.email,
                    }}
                  >
                    Track Application Status
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/admissions">Back to Admissions Info</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Online Admissions"
        title="Application for Admission"
        description="Complete the form below to begin your admission process into Maxfem International School."
      />

      <div className="section-y bg-surface">
        <div className="container-page max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Candidate Personal Details */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  1. Candidate Personal Information
                </CardTitle>
                <CardDescription>
                  Enter the prospective student's official name as registered on their birth
                  certificate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs font-semibold">
                      First Name *
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="e.g. Samuel"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs font-semibold">
                      Last Name *
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="e.g. Adeleke"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="other_name" className="text-xs font-semibold">
                      Middle / Other Name
                    </Label>
                    <Input
                      id="other_name"
                      value={formData.other_name}
                      onChange={(e) => setFormData({ ...formData, other_name: e.target.value })}
                      placeholder="e.g. David"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth" className="text-xs font-semibold">
                      Date of Birth *
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs font-semibold">
                      Gender *
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val: Gender) => setFormData({ ...formData, gender: val })}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Primary Contact Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="parent@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">
                      Primary Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 800 000 0000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Residential Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House number, Street, City, State"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Target Entry Class & Academic Session */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  2. Entry Class & Academic Session
                </CardTitle>
                <CardDescription>
                  Select the class and academic session the candidate seeks admission for.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="desired_class_id" className="text-xs font-semibold">
                      Desired Entry Class *
                    </Label>
                    <Select
                      value={formData.desired_class_id}
                      onValueChange={(val) => setFormData({ ...formData, desired_class_id: val })}
                    >
                      <SelectTrigger id="desired_class_id">
                        <SelectValue placeholder="Select target class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} {cls.arm ? `(${cls.arm})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="desired_academic_session_id" className="text-xs font-semibold">
                      Academic Session *
                    </Label>
                    <Select
                      value={formData.desired_academic_session_id}
                      onValueChange={(val) =>
                        setFormData({ ...formData, desired_academic_session_id: val })
                      }
                    >
                      <SelectTrigger id="desired_academic_session_id">
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((ses) => (
                          <SelectItem key={ses.id} value={ses.id}>
                            {ses.name} {ses.is_current ? "(Current Session)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Parent / Guardian Details */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  3. Parent / Guardian Information
                </CardTitle>
                <CardDescription>
                  Provide contact details of the parent or legal guardian responsible for this
                  application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="guardian_name" className="text-xs font-semibold">
                      Guardian Full Name *
                    </Label>
                    <Input
                      id="guardian_name"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      placeholder="Mr. Adeleke"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guardian_relationship" className="text-xs font-semibold">
                      Relationship to Student *
                    </Label>
                    <Input
                      id="guardian_relationship"
                      value={formData.guardian_relationship}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardian_relationship: e.target.value,
                        })
                      }
                      placeholder="e.g. Father, Mother, Guardian"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="guardian_phone" className="text-xs font-semibold">
                      Guardian Phone Number *
                    </Label>
                    <Input
                      id="guardian_phone"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      placeholder="+234 800 000 0000"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guardian_email" className="text-xs font-semibold">
                      Guardian Email (Optional)
                    </Label>
                    <Input
                      id="guardian_email"
                      type="email"
                      value={formData.guardian_email}
                      onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                      placeholder="guardian@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Previous Academic Background */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  4. Previous Academic Background
                </CardTitle>
                <CardDescription>
                  Details of former school attended (leave empty if first-time schooling).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label htmlFor="previous_school" className="text-xs font-semibold">
                      Previous School Attended
                    </Label>
                    <Input
                      id="previous_school"
                      value={formData.previous_school}
                      onChange={(e) =>
                        setFormData({ ...formData, previous_school: e.target.value })
                      }
                      placeholder="e.g. Divine Grace Academy"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label htmlFor="previous_class" className="text-xs font-semibold">
                      Last Class Completed
                    </Label>
                    <Input
                      id="previous_class"
                      value={formData.previous_class}
                      onChange={(e) => setFormData({ ...formData, previous_class: e.target.value })}
                      placeholder="e.g. Primary 5"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label htmlFor="previous_grade_average" className="text-xs font-semibold">
                      Approximate Grade / Average
                    </Label>
                    <Input
                      id="previous_grade_average"
                      value={formData.previous_grade_average}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          previous_grade_average: e.target.value,
                        })
                      }
                      placeholder="e.g. 85% / Grade A"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 5: Required Document Uploads */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  5. Upload Supporting Credentials
                </CardTitle>
                <CardDescription>
                  Attach digital copies of birth certificate and previous report card (PDF, JPG,
                  PNG). Documents can also be submitted later or verified in person.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Birth Certificate */}
                  <div className="p-3.5 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors space-y-2">
                    <Label className="text-xs font-semibold block">Birth Certificate</Label>
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setBirthCertFile(e.target.files[0]);
                        }
                      }}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {birthCertFile
                        ? birthCertFile.name
                        : "Optional now, required for final enrollment"}
                    </p>
                  </div>

                  {/* Previous Report Card */}
                  <div className="p-3.5 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors space-y-2">
                    <Label className="text-xs font-semibold block">
                      Last Report Card / Transcript
                    </Label>
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setReportCardFile(e.target.files[0]);
                        }
                      }}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {reportCardFile ? reportCardFile.name : "Optional now"}
                    </p>
                  </div>

                  {/* Passport Photo */}
                  <div className="p-3.5 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors space-y-2">
                    <Label className="text-xs font-semibold block">Passport Photograph</Label>
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPassportPhotoFile(e.target.files[0]);
                        }
                      }}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {passportPhotoFile ? passportPhotoFile.name : "Recent color passport photo"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Declaration & Submission */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="declaration"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  required
                />
                <label
                  htmlFor="declaration"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I hereby declare that all information submitted in this application is correct and
                  accurate to the best of my knowledge. I understand that falsification of academic
                  or personal credentials may result in the forfeiture of admission.
                </label>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Upon submission, you will receive an official Application Number to track
                  progress.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || loadingInitial || !termsAccepted}
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md"
                >
                  {submitting ? "Submitting Application..." : "Submit Application"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
