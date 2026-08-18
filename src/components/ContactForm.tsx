import { useState, type FormEvent } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^[0-9+()\-\s]+$/, "Phone number contains invalid characters"),
  subject: z.string().trim().min(3, "Please enter a subject").max(150),
  message: z.string().trim().min(10, "Please enter at least 10 characters").max(1000),
});

type Field = keyof z.infer<typeof contactSchema>;

const fields: { name: Field; label: string; type?: string; autoComplete?: string }[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "subject", label: "Subject" },
];

export function ContactForm() {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const result = contactSchema.safeParse(data);

    if (!result.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as Field;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setSubmitted(false);
      const firstInvalid = form.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    // Phase 1: temporary local handler. A real submission endpoint will be
    // connected when the backend is introduced in a later phase.
    setErrors({});
    setSubmitted(true);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.name === "subject" ? "sm:col-span-2" : undefined}>
            <Label htmlFor={`contact-${field.name}`}>{field.label}</Label>
            <Input
              id={`contact-${field.name}`}
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              required
              aria-invalid={errors[field.name] ? "true" : undefined}
              aria-describedby={errors[field.name] ? `contact-${field.name}-error` : undefined}
              className="mt-2"
            />
            {errors[field.name] ? (
              <p
                id={`contact-${field.name}-error`}
                role="alert"
                className="mt-1.5 text-sm text-destructive"
              >
                {errors[field.name]}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          maxLength={1000}
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className="mt-2"
        />
        {errors.message ? (
          <p id="contact-message-error" role="alert" className="mt-1.5 text-sm text-destructive">
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg">
          Submit enquiry
        </Button>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {submitted
            ? "Thank you — your message has been validated. Message delivery will be enabled once the school inbox is connected."
            : "We aim to respond within two working days."}
        </p>
      </div>
    </form>
  );
}
