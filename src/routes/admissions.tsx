import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { CTASection } from "@/components/cards";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "1. Enquire",
    body: "Send us an enquiry with your child's details and preferred entry stage.",
  },
  {
    title: "2. Visit",
    body: "Arrange a campus visit to meet our team and see the learning environment.",
  },
  {
    title: "3. Apply",
    body: "Complete the application form and submit required documents. PLACEHOLDER — official requirements to be confirmed.",
  },
  {
    title: "4. Assessment",
    body: "Age-appropriate assessment and interview. PLACEHOLDER — process to be confirmed.",
  },
  {
    title: "5. Offer",
    body: "Successful applicants receive an offer and enrolment details.",
  },
  {
    title: "6. Enrol",
    body: "Complete enrolment and join the Maxfem community.",
  },
];

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Maxfem International School" },
      {
        name: "description",
        content:
          "Admissions at Maxfem International School: enquire, visit, apply and enrol. Start your child's journey with us.",
      },
      { property: "og:title", content: "Admissions — Maxfem International School" },
      {
        property: "og:description",
        content: "How to apply and join the Maxfem International School community.",
      },
      { property: "og:url", content: "/admissions" },
    ],
    links: [{ rel: "canonical", href: "/admissions" }],
  }),
  component: Admissions,
});

function Admissions() {
  return (
    <>
      <PageHeader
        eyebrow="Admissions"
        title="Begin Your Child's Journey With Maxfem"
        description="We welcome families who value academic ambition, character and community. The steps below outline our admissions process."
      />

      <section className="section-y">
        <div className="container-page">
          <SectionHeading
            eyebrow="Process"
            title="How admission works"
            description="Official entry requirements, fees and deadlines will be published here once confirmed by the school."
            className="mb-12"
          />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.title}
                className="rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground mb-3">
                  Online Portal Live
                </span>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Online Admission Application & Status Tracking
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Parents and prospective students can submit applications directly online, upload
                  required documents (birth certificates, prior school records), and track admission
                  decisions in real time.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Link to="/admissions/apply">Apply for Admission</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/admissions/status">Track Status</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Have a question about joining Maxfem?"
        description="Our admissions team is available during school office hours to help."
        primary={{ label: "Contact Admissions", to: "/contact" }}
        secondary={{ label: "Explore Academics", to: "/academics" }}
      />
    </>
  );
}
