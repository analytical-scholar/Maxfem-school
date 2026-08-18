import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Maxfem International School" },
      {
        name: "description",
        content:
          "How cookies and similar technologies are used on the Maxfem International School website.",
      },
      { property: "og:title", content: "Cookie Policy — Maxfem International School" },
      { property: "og:description", content: "How cookies are used on this website." },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: Cookies,
});

function Cookies() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Cookie Policy" />
      <section className="section-y">
        <div className="container-page max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            PLACEHOLDER — this cookie policy is a structural placeholder. It will be finalised once
            analytics and other website services are configured.
          </p>
          <h2 className="font-display text-lg font-semibold text-foreground">Essential cookies</h2>
          <p>Required for the website to function correctly.</p>
          <h2 className="font-display text-lg font-semibold text-foreground">Analytics</h2>
          <p>
            No analytics or marketing cookies are currently in use on this website. This section
            will be updated if that changes.
          </p>
        </div>
      </section>
    </>
  );
}
