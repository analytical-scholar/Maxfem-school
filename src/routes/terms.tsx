import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Maxfem International School" },
      {
        name: "description",
        content: "Terms governing use of the Maxfem International School website.",
      },
      { property: "og:title", content: "Terms of Use — Maxfem International School" },
      { property: "og:description", content: "Terms governing use of this website." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Use" />
      <section className="section-y">
        <div className="container-page max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            PLACEHOLDER — these terms are a structural placeholder. The school's official terms of
            use will replace this text before launch.
          </p>
          <h2 className="font-display text-lg font-semibold text-foreground">Use of this site</h2>
          <p>
            Content on this website is provided for general information about the school and may be
            updated at any time.
          </p>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Intellectual property
          </h2>
          <p>
            Website content and imagery remain the property of the school unless stated otherwise.
          </p>
        </div>
      </section>
    </>
  );
}
