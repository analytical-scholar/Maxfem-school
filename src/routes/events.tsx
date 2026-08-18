import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { CTASection, EventCard } from "@/components/cards";
import { events } from "@/data/site";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Maxfem International School" },
      {
        name: "description",
        content:
          "Upcoming open days, conferences and community events at Maxfem International School.",
      },
      { property: "og:title", content: "Events — Maxfem International School" },
      {
        property: "og:description",
        content: "Open days, parent conferences and community events across the school year.",
      },
      { property: "og:url", content: "/events" },
    ],
    links: [{ rel: "canonical", href: "/events" }],
  }),
  component: Events,
});

function Events() {
  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Upcoming school events"
        description="Sample events shown here will be replaced with the school's official calendar."
      />

      <section className="section-y">
        <div className="container-page grid gap-5 lg:grid-cols-3">
          {events.map((item) => (
            <EventCard key={item.slug} {...item} />
          ))}
        </div>
      </section>

      <CTASection
        title="Join us at our next open day"
        description="Get in touch to confirm dates and reserve a place for your family."
        primary={{ label: "Contact Us", to: "/contact" }}
        secondary={{ label: "Read School News", to: "/news" }}
      />
    </>
  );
}
