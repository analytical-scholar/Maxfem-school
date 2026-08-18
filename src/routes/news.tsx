import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { EventCard, NewsCard } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { events, news } from "@/data/site";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Events — Maxfem International School" },
      {
        name: "description",
        content: "School news, announcements and upcoming events at Maxfem International School.",
      },
      { property: "og:title", content: "News & Events — Maxfem International School" },
      {
        property: "og:description",
        content: "The latest news, announcements and events from our school community.",
      },
      { property: "og:url", content: "/news" },
    ],
    links: [{ rel: "canonical", href: "/news" }],
  }),
  component: News,
});

function News() {
  return (
    <>
      <PageHeader
        eyebrow="News & events"
        title="What's happening at Maxfem"
        description="Sample entries below demonstrate the layout. Real news and events will be published from the school's content system."
      />

      <section className="section-y">
        <div className="container-page">
          <SectionHeading eyebrow="School news" title="Latest articles" className="mb-12" />
          <div className="grid gap-5 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.slug} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeading eyebrow="Upcoming" title="Events calendar" className="mb-12" />
          <div className="grid gap-5 lg:grid-cols-3">
            {events.map((item) => (
              <EventCard key={item.slug} {...item} />
            ))}
          </div>
          <Button asChild variant="outline" size="lg" className="mt-10">
            <Link to="/events">View All Events</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
