import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { ContactForm } from "@/components/ContactForm";
import { school } from "@/data/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Maxfem International School" },
      {
        name: "description",
        content:
          "Contact Maxfem International School: address, phone, email, office hours and enquiry form.",
      },
      { property: "og:title", content: "Contact Us — Maxfem International School" },
      { property: "og:description", content: "Get in touch with our school office team." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const details = [
    { icon: MapPin, label: "Address", value: school.contact.addressLines.join(", ") },
    { icon: Phone, label: "Phone", value: school.contact.phone },
    { icon: Mail, label: "Email", value: school.contact.email },
    { icon: Clock, label: "Office hours", value: school.contact.officeHours },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch with Maxfem"
        description="Contact details shown are placeholders and will be updated with the school's official information."
      />

      <section className="section-y">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="School office" title="Contact details" />
            <dl className="mt-8 space-y-6">
              {details.map((d) => (
                <div key={d.label} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <d.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-sm font-medium text-foreground">{d.label}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {d.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-10 overflow-hidden rounded-xl border border-border bg-surface">
              <div className="grid aspect-[4/3] place-items-center p-6 text-center sm:aspect-[16/9]">
                <p className="text-sm text-muted-foreground">
                  Google Maps location placeholder — the map will be embedded once the school's
                  campus address is confirmed.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <SectionHeading
              eyebrow="Enquiry form"
              title="Send us a message"
              description="Complete the form and our office team will respond during school hours."
            />
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
