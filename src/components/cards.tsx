import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, MapPin, Quote } from "lucide-react";

import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

const cardBase =
  "rounded-xl border border-border bg-card p-6 shadow-card transition-shadow duration-200 hover:shadow-elevated";

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <article className={cardBase}>
      <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
        <Icon name={icon} className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </article>
  );
}

export function AcademicCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article className={cn(cardBase, "flex flex-col")}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Icon name={icon} className="size-5" />
        </span>
        <h3 className="min-w-0 font-display text-base font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </article>
  );
}

export function FacilityCard({
  title,
  description,
  image,
  alt,
}: {
  title: string;
  description: string;
  image: string;
  alt: string;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow duration-200 hover:shadow-elevated">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={1200}
          height={900}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

export function GalleryCard({
  image,
  alt,
  category,
}: {
  image: string;
  alt: string;
  category: string;
}) {
  return (
    <figure className="group relative overflow-hidden rounded-xl border border-border bg-muted">
      <div className="aspect-[4/3]">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={1200}
          height={900}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 bg-primary/85 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-primary-foreground">
        {category}
      </figcaption>
    </figure>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function NewsCard({
  title,
  excerpt,
  date,
  category,
}: {
  title: string;
  excerpt: string;
  date: string;
  category: string;
}) {
  return (
    <article className={cn(cardBase, "flex flex-col")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
          {category}
        </span>
        <time dateTime={date}>{formatDate(date)}</time>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
      <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        Full article coming soon
        <ArrowRight className="size-4" aria-hidden="true" />
      </p>
    </article>
  );
}

export function EventCard({
  title,
  date,
  time,
  location,
  description,
}: {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}) {
  return (
    <article className={cn(cardBase, "flex flex-col")}>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Date</dt>
          <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <dd>
            <time dateTime={date}>{formatDate(date)}</time>
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Time</dt>
          <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <dd>{time}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Location</dt>
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <dd>{location}</dd>
        </div>
      </dl>
    </article>
  );
}

export function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <figure className={cn(cardBase, "flex h-full flex-col")}>
      <Quote className="size-6 text-gold" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
        {quote}
      </blockquote>
      <figcaption className="mt-5 border-t border-border pt-4 text-sm">
        <span className="block font-medium text-foreground">{name}</span>
        <span className="block text-muted-foreground">{role}</span>
      </figcaption>
    </figure>
  );
}

export function CTASection({
  eyebrow,
  title,
  description,
  primary,
  secondary,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container-page section-y">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="eyebrow justify-center text-primary-foreground/70">{eyebrow}</p>
          ) : null}
          <h2 className="mt-3 text-balance font-display text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">{description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={primary.to}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-7 text-[0.95rem] font-medium text-gold-foreground transition-colors hover:bg-gold/90"
            >
              {primary.label}
            </Link>
            {secondary ? (
              <Link
                to={secondary.to}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-foreground/35 px-7 text-[0.95rem] font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
