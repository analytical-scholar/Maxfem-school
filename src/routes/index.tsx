import { createFileRoute, Link } from "@tanstack/react-router";

import { Hero } from "@/components/home/Hero";
import { SectionHeading } from "@/components/SectionHeading";
import {
  AcademicCard,
  CTASection,
  EventCard,
  FacilityCard,
  FeatureCard,
  GalleryCard,
  NewsCard,
  TestimonialCard,
} from "@/components/cards";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { aboutClassroom, facilities, galleryItems } from "@/data/media";
import {
  academics,
  events,
  highlights,
  news,
  school,
  schoolLife,
  testimonials,
  values,
  whyChoose,
} from "@/data/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maxfem International School — Excellence in Education" },
      {
        name: "description",
        content:
          "Maxfem International School offers a nurturing, academically rigorous international education that prepares students for a changing world.",
      },
      { property: "og:title", content: "Maxfem International School — Excellence in Education" },
      {
        property: "og:description",
        content:
          "A nurturing, academically rigorous international education preparing students for a changing world.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />

      {/* Highlights */}
      <section className="section-y bg-surface" aria-labelledby="highlights-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why families choose us"
            title="An education built on care, rigour and ambition"
            description="Every part of school life at Maxfem is designed to help students learn deeply, grow in character and prepare for what comes next."
            className="mb-12"
          />
          <h2 id="highlights-heading" className="sr-only">
            School highlights
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section-y" aria-labelledby="about-heading">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl border border-border shadow-card">
            <img
              src={aboutClassroom}
              alt="A Maxfem teacher guiding students during a classroom lesson"
              loading="lazy"
              decoding="async"
              width={1200}
              height={1200}
              className="aspect-[4/3] size-full object-cover lg:aspect-square"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="About Maxfem"
              title="A community where high expectations meet genuine care"
              description={`${school.name} is an international school committed to academic excellence, character development and the wellbeing of every student. Detailed school history and official information will be published once confirmed.`}
            />
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v.title}>
                  <dt className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-primary">
                    {v.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</dd>
                </div>
              ))}
            </dl>
            <Button asChild size="lg" className="mt-9">
              <Link to="/about">Discover Our Story</Link>
            </Button>
          </div>
        </div>
        <h2 id="about-heading" className="sr-only">
          About Maxfem International School
        </h2>
      </section>

      {/* Academics */}
      <section className="section-y bg-surface" aria-labelledby="academics-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="Academics"
            title="A broad, structured curriculum across every stage"
            description="Curriculum content shown below is placeholder structure and will be replaced with the school's official programme details."
            className="mb-12"
          />
          <h2 id="academics-heading" className="sr-only">
            Academic programmes
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {academics.map((item) => (
              <AcademicCard key={item.title} {...item} />
            ))}
          </div>
          <Button asChild variant="outline" size="lg" className="mt-10">
            <Link to="/academics">Explore Academics</Link>
          </Button>
        </div>
      </section>

      {/* Why choose */}
      <section className="section-y" aria-labelledby="why-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why choose Maxfem"
            title="The Maxfem difference"
            align="center"
            className="mb-12"
          />
          <h2 id="why-heading" className="sr-only">
            Why choose Maxfem
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item) => (
              <li
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon name={item.icon} className="size-4.5" />
                </span>
                <span className="min-w-0 text-sm font-medium text-foreground">{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Facilities */}
      <section className="section-y bg-surface" aria-labelledby="facilities-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="Facilities"
            title="Spaces designed for learning"
            description="Facility imagery and descriptions are placeholders pending confirmation of the school's campus details."
            className="mb-12"
          />
          <h2 id="facilities-heading" className="sr-only">
            Campus facilities
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.slice(0, 6).map((f) => (
              <FacilityCard key={f.title} {...f} />
            ))}
          </div>
          <Button asChild variant="outline" size="lg" className="mt-10">
            <Link to="/facilities">View All Facilities</Link>
          </Button>
        </div>
      </section>

      {/* School life */}
      <section className="section-y" aria-labelledby="life-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="School life"
            title="Learning that extends beyond the classroom"
            className="mb-12"
          />
          <h2 id="life-heading" className="sr-only">
            School life
          </h2>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {schoolLife.map((item) => (
              <div key={item.title} className="border-l-2 border-gold pl-5">
                <h3 className="font-display text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admissions CTA */}
      <CTASection
        eyebrow="Admissions"
        title="Begin Your Child's Journey With Maxfem"
        description="Applications for the coming academic year are handled through our admissions team. The full online application will open here soon."
        primary={{ label: "Start Your Application", to: "/admissions" }}
        secondary={{ label: "Contact Admissions", to: "/contact" }}
      />

      {/* News & events */}
      <section className="section-y" aria-labelledby="news-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="News & events"
            title="What's happening at Maxfem"
            description="Sample entries shown below demonstrate the layout; real news and events will be published from the school's content system."
            className="mb-12"
          />
          <h2 id="news-heading" className="sr-only">
            News and events
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.slug} {...item} />
            ))}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {events.map((item) => (
              <EventCard key={item.slug} {...item} />
            ))}
          </div>
          <Button asChild variant="outline" size="lg" className="mt-10">
            <Link to="/news">View All News & Events</Link>
          </Button>
        </div>
      </section>

      {/* Gallery */}
      <section className="section-y bg-surface" aria-labelledby="gallery-heading">
        <div className="container-page">
          <SectionHeading eyebrow="Gallery" title="Life at Maxfem in pictures" className="mb-12" />
          <h2 id="gallery-heading" className="sr-only">
            Gallery
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {galleryItems.slice(0, 8).map((item) => (
              <GalleryCard key={item.id} {...item} />
            ))}
          </div>
          <Button asChild variant="outline" size="lg" className="mt-10">
            <Link to="/gallery">Open Gallery</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-y" aria-labelledby="testimonials-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="Community voices"
            title="Sample testimonials"
            description="These are clearly marked placeholders. Verified testimonials from parents, students and alumni will replace them."
            align="center"
            className="mb-12"
          />
          <h2 id="testimonials-heading" className="sr-only">
            Testimonials
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
