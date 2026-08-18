import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { CTASection, FacilityCard } from "@/components/cards";
import { facilities } from "@/data/media";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title: "Facilities — Maxfem International School" },
      {
        name: "description",
        content:
          "Classrooms, science laboratories, ICT suites, library, sports and creative arts spaces at Maxfem International School.",
      },
      { property: "og:title", content: "Facilities — Maxfem International School" },
      {
        property: "og:description",
        content: "Campus spaces designed to support focused, active learning.",
      },
      { property: "og:url", content: "/facilities" },
    ],
    links: [{ rel: "canonical", href: "/facilities" }],
  }),
  component: Facilities,
});

function Facilities() {
  return (
    <>
      <PageHeader
        eyebrow="Facilities"
        title="Spaces designed for learning"
        description="Imagery and descriptions on this page are placeholders pending official campus photography and confirmed facility details."
      />

      <section className="section-y">
        <div className="container-page grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => (
            <FacilityCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      <CTASection
        title="Visit our campus"
        description="Arrange a tour to experience the learning environment first hand."
        primary={{ label: "Book a Visit", to: "/contact" }}
        secondary={{ label: "View Gallery", to: "/gallery" }}
      />
    </>
  );
}
