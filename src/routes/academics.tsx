import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { AcademicCard, CTASection } from "@/components/cards";
import { academics, schoolLife } from "@/data/site";

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title: "Academics — Maxfem International School" },
      {
        name: "description",
        content:
          "Explore the academic programme at Maxfem International School across Early Years, Primary, Secondary, STEM, Arts and Technology.",
      },
      { property: "og:title", content: "Academics — Maxfem International School" },
      {
        property: "og:description",
        content: "Our academic approach across every stage of school.",
      },
      { property: "og:url", content: "/academics" },
    ],
    links: [{ rel: "canonical", href: "/academics" }],
  }),
  component: Academics,
});

function Academics() {
  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="A broad, structured curriculum across every stage"
        description="Programme structure shown here is placeholder content and will be replaced with the school's official curriculum details."
      />

      <section className="section-y">
        <div className="container-page">
          <SectionHeading
            eyebrow="Programmes"
            title="Learning stages and subject areas"
            className="mb-12"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {academics.map((item) => (
              <AcademicCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeading
            eyebrow="Beyond the curriculum"
            title="Enrichment that supports academic growth"
            className="mb-12"
          />
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

      <CTASection
        title="Questions about our curriculum?"
        description="Our academic team is happy to discuss programmes, entry points and subject choices."
        primary={{ label: "Contact Us", to: "/contact" }}
        secondary={{ label: "Apply Now", to: "/admissions" }}
      />
    </>
  );
}
