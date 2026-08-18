import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { CTASection, FeatureCard } from "@/components/cards";
import { aboutClassroom } from "@/data/media";
import { highlights, school, values } from "@/data/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Maxfem International School" },
      {
        name: "description",
        content:
          "Learn about Maxfem International School: our mission, vision, core values and educational philosophy.",
      },
      { property: "og:title", content: "About Us — Maxfem International School" },
      {
        property: "og:description",
        content: "Our mission, vision, core values and educational philosophy.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A community where high expectations meet genuine care"
        description={`${school.name} is committed to academic excellence, character development and the wellbeing of every student.`}
      />

      <section className="section-y">
        <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl border border-border shadow-card">
            <img
              src={aboutClassroom}
              alt="A lesson in progress in a Maxfem classroom"
              loading="lazy"
              decoding="async"
              width={1200}
              height={1200}
              className="aspect-[4/3] size-full object-cover lg:aspect-square"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="Our story"
              title="Educating with purpose"
              description="Official school history, founding details and leadership information will be published here once supplied by the school. The structure below is ready for that content."
            />
            <dl className="mt-8 space-y-6">
              {values.map((v) => (
                <div key={v.title} className="border-l-2 border-gold pl-5">
                  <dt className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-primary">
                    {v.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeading eyebrow="What defines us" title="Our commitments" className="mb-12" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Come and see Maxfem for yourself"
        description="Arrange a visit or speak with our team about joining the school community."
        primary={{ label: "Start Your Application", to: "/admissions" }}
        secondary={{ label: "Contact Us", to: "/contact" }}
      />
    </>
  );
}
