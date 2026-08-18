import { Link } from "@tanstack/react-router";

import { heroCampus } from "@/data/media";
import { school } from "@/data/site";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-primary-deep text-primary-foreground">
      <img
        src={heroCampus}
        alt="Maxfem students walking together across the school campus"
        width={1600}
        height={1104}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-10 size-full object-cover object-center opacity-55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-primary-deep/70 sm:bg-gradient-to-r sm:from-primary-deep/95 sm:via-primary-deep/75 sm:to-primary-deep/25"
      />

      <div className="container-page py-20 md:py-28 lg:py-36">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary-foreground/75">
            <span aria-hidden="true" className="h-px w-6 bg-gold" />
            {school.name}
          </p>
          <h1 className="mt-5 text-balance font-display text-3xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
            {school.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
            {school.intro}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/about"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-7 text-[0.95rem] font-medium text-gold-foreground transition-colors hover:bg-gold/90"
            >
              Explore Maxfem
            </Link>
            <Link
              to="/admissions"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-foreground/40 px-7 text-[0.95rem] font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
