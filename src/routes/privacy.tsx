import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Maxfem International School" },
      {
        name: "description",
        content:
          "How Maxfem International School collects, uses and protects personal information submitted through this website.",
      },
      { property: "og:title", content: "Privacy Policy — Maxfem International School" },
      { property: "og:description", content: "Our approach to privacy and personal data." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <section className="section-y">
        <div className="container-page max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            PLACEHOLDER — this privacy policy is a structural placeholder. The school's official
            policy, prepared with appropriate legal review, will replace this text before launch.
          </p>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Information we collect
          </h2>
          <p>
            Information submitted through website enquiry forms, such as name, email address, phone
            number and message content.
          </p>
          <h2 className="font-display text-lg font-semibold text-foreground">How it is used</h2>
          <p>
            To respond to enquiries and to provide information about admissions and school
            activities.
          </p>
          <h2 className="font-display text-lg font-semibold text-foreground">Contact</h2>
          <p>For questions about this policy, please contact the school office.</p>
        </div>
      </section>
    </>
  );
}
