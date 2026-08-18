import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="eyebrow">
          <span aria-hidden="true" className="h-px w-6 bg-gold" />
          {eyebrow}
        </p>
      ) : null}
      <Tag
        className={cn(
          "mt-3 text-balance font-semibold text-foreground",
          Tag === "h1"
            ? "text-3xl leading-tight sm:text-4xl lg:text-5xl"
            : "text-2xl leading-tight sm:text-3xl lg:text-4xl",
        )}
      >
        {title}
      </Tag>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
