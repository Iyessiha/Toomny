"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/dictionaries";
import { addRecruiterRole, becomeProvider } from "@/app/(fr)/dashboard/role/actions";

const copy = {
  fr: {
    recruiterTitle: "Commander des prestations",
    recruiterBody: "Vous êtes prestataire. Activez aussi le rôle recruteur pour commander des prestations auprès d'autres prestataires.",
    recruiterCta: "Activer le rôle recruteur",
    providerTitle: "Devenir prestataire",
    providerBody: "Proposez vos services sur Toomny. Remplissez ce court formulaire, puis vérifiez votre identité pour publier.",
    headline: "Titre de votre activité",
    headlinePlaceholder: "Ex. Graphiste, développeur web, monteur vidéo",
    city: "Ville",
    skills: "Compétences",
    skillsPlaceholder: "Ex. logo, identité visuelle, réseaux sociaux",
    submit: "Devenir prestataire",
    saving: "Enregistrement…",
  },
  en: {
    recruiterTitle: "Order services",
    recruiterBody: "You are a provider. Also activate the client role to order services from other providers.",
    recruiterCta: "Activate the client role",
    providerTitle: "Become a provider",
    providerBody: "Offer your services on Toomny. Fill in this short form, then verify your identity to publish.",
    headline: "Title of your activity",
    headlinePlaceholder: "E.g. graphic designer, web developer, video editor",
    city: "City",
    skills: "Skills",
    skillsPlaceholder: "E.g. logo, brand identity, social media",
    submit: "Become a provider",
    saving: "Saving…",
  },
} as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)]";

export function AddRecruiterCard({ locale = "fr" }: { locale?: Locale }) {
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
      <h2 className="font-display text-base font-bold">{t.recruiterTitle}</h2>
      <p className="mt-1 text-sm text-[var(--subtle)]">{t.recruiterBody}</p>
      {error && <p role="alert" className="notice notice-danger mt-3">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await addRecruiterRole();
            if ("error" in result) setError(result.error);
            else router.refresh();
          })
        }
        className="btn-primary mt-4 disabled:opacity-50"
      >
        {pending ? t.saving : t.recruiterCta}
      </button>
    </section>
  );
}

export function BecomeProviderCard({ locale = "fr" }: { locale?: Locale }) {
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await becomeProvider(form);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
      <h2 className="font-display text-base font-bold">{t.providerTitle}</h2>
      <p className="mt-1 text-sm text-[var(--subtle)]">{t.providerBody}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="bp-headline" className="text-sm font-medium">{t.headline}</label>
          <input id="bp-headline" name="headline" required maxLength={120} placeholder={t.headlinePlaceholder} className={inputClass} />
        </div>
        <div>
          <label htmlFor="bp-city" className="text-sm font-medium">{t.city}</label>
          <input id="bp-city" name="city" maxLength={80} className={inputClass} />
        </div>
        <div>
          <label htmlFor="bp-skills" className="text-sm font-medium">{t.skills}</label>
          <input id="bp-skills" name="skills" maxLength={500} placeholder={t.skillsPlaceholder} className={inputClass} />
        </div>
        {error && <p role="alert" className="notice notice-danger">{error}</p>}
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
          {pending ? t.saving : t.submit}
        </button>
      </form>
    </section>
  );
}
