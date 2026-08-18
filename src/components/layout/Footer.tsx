import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { school } from "@/data/site";

const columns = [
  {
    heading: "School",
    links: [
      { label: "About", to: "/about" },
      { label: "Academics", to: "/academics" },
      { label: "Facilities", to: "/facilities" },
      { label: "Admissions", to: "/admissions" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "News", to: "/news" },
      { label: "Events", to: "/events" },
      { label: "Gallery", to: "/gallery" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    heading: "Portals",
    links: [
      { label: "Student Portal", to: "/student-portal", note: "Coming soon" },
      { label: "Teacher Portal", to: "/student-portal", note: "Coming soon" },
      { label: "Admin Portal", to: "/student-portal", note: "Coming soon" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Use", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container-page grid gap-12 py-14 md:py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-foreground font-display text-base font-bold text-primary"
            >
              M
            </span>
            <span className="font-display text-base font-bold">{school.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/75">{school.intro}</p>
          <ul className="mt-6 space-y-2.5 text-sm text-primary-foreground/80">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{school.contact.addressLines.join(", ")}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a
                className="hover:underline"
                href={`tel:${school.contact.phone.replace(/\s/g, "")}`}
              >
                {school.contact.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a className="hover:underline" href={`mailto:${school.contact.email}`}>
                {school.contact.email}
              </a>
            </li>
          </ul>
          <p className="mt-6 text-xs text-primary-foreground/55">
            Social media channels to be confirmed by the school.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground hover:underline"
                    >
                      {link.label}
                      {"note" in link && link.note ? (
                        <span className="ml-1.5 text-[0.65rem] uppercase tracking-wide text-gold">
                          {link.note}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="container-page py-6">
          <p className="text-xs text-primary-foreground/65">
            © 2026 {school.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
