import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { CTASection, GalleryCard } from "@/components/cards";
import { galleryItems, type GalleryCategory } from "@/data/media";
import { cn } from "@/lib/utils";

const categories: (GalleryCategory | "All")[] = [
  "All",
  "Campus",
  "Classroom",
  "Academics",
  "Sports",
  "Events",
  "Student Life",
];

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Maxfem International School" },
      {
        name: "description",
        content:
          "Photographs of campus, classrooms, academics, sports, events and student life at Maxfem International School.",
      },
      { property: "og:title", content: "Gallery — Maxfem International School" },
      { property: "og:description", content: "Life at Maxfem International School in pictures." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: Gallery,
});

function Gallery() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const items = active === "All" ? galleryItems : galleryItems.filter((i) => i.category === active);

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Life at Maxfem in pictures"
        description="Placeholder imagery is used until official school photography is provided."
      />

      <section className="section-y">
        <div className="container-page">
          <div
            role="group"
            aria-label="Filter gallery by category"
            className="mb-10 flex flex-wrap gap-2"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={active === cat}
                onClick={() => setActive(cat)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <GalleryCard key={item.id} {...item} />
            ))}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images in this category yet.</p>
          ) : null}
        </div>
      </section>

      <CTASection
        title="See the school in person"
        description="Photographs only tell part of the story — visit us to experience Maxfem."
        primary={{ label: "Arrange a Visit", to: "/contact" }}
      />
    </>
  );
}
