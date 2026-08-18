export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-border bg-primary text-primary-foreground">
      <div className="container-page py-14 md:py-20">
        {eyebrow ? (
          <p className="eyebrow text-primary-foreground/70">
            <span aria-hidden="true" className="h-px w-6 bg-gold" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
