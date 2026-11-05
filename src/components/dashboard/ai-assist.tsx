"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/dictionaries";
import { generateProfileWithAi, createServicesWithAi } from "@/app/(fr)/dashboard/assistant/actions";
import type { ProfileDraft } from "@/lib/provider-assist";

const copy = {
  fr: {
    upsellTitle: "Gagnez du temps avec l'assistant IA",
    upsellBody: "Décrivez votre activité : l'IA rédige votre profil et crée vos prestations en brouillon. Inclus dans les plans Essentiel, Pro et Expert.",
    upsellCta: "Voir les plans",
    profileTitle: "Remplir mon profil avec l'IA",
    profileBody: "Seuls les champs vides sont remplis. Relisez le résultat puis enregistrez.",
    servicesTitle: "Créer mes prestations avec l'IA",
    servicesBody: "Jusqu'à 5 prestations en brouillon, dans la limite de votre plan. Rien n'est publié sans relecture et modération.",
    placeholder: "Ex. Je suis graphiste à Abidjan depuis 5 ans : logos, affiches et identité visuelle pour les PME.",
    run: "Générer",
    running: "Génération…",
    filled: "Champs remplis. Relisez puis enregistrez le profil.",
    created: (n: number) => `${n} prestation(s) créée(s) en brouillon. Relisez-les puis publiez-les.`,
  },
  en: {
    upsellTitle: "Save time with the AI assistant",
    upsellBody: "Describe your activity: the AI writes your profile and creates your services as drafts. Included in the Essentiel, Pro and Expert plans.",
    upsellCta: "See plans",
    profileTitle: "Fill my profile with AI",
    profileBody: "Only empty fields are filled. Review the result, then save.",
    servicesTitle: "Create my services with AI",
    servicesBody: "Up to 5 draft services, within your plan's limit. Nothing is published without review and moderation.",
    placeholder: "E.g. I am a graphic designer in Abidjan for 5 years: logos, posters and visual identity for SMEs.",
    run: "Generate",
    running: "Generating…",
    filled: "Fields filled. Review, then save the profile.",
    created: (n: number) => `${n} service(s) created as drafts. Review them, then publish.`,
  },
} as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)]";

export function AiUpsell({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="font-semibold">{t.upsellTitle}</p>
      <p className="mt-1 text-sm text-[var(--subtle)]">{t.upsellBody}</p>
      <Link href="/dashboard/plan" className="btn-primary btn-sm mt-4 inline-flex">
        {t.upsellCta}
      </Link>
    </div>
  );
}

/** Remplit le profil : renvoie le brouillon au parent, qui le fusionne dans le formulaire. */
export function AiProfilePanel({
  locale,
  onDraft,
}: {
  locale: Locale;
  onDraft: (draft: ProfileDraft) => void;
}) {
  const t = copy[locale];
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await generateProfileWithAi(text);
      if ("error" in result) setError(result.error);
      else {
        onDraft(result.draft);
        setNotice(t.filled);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] p-5">
      <p className="font-semibold">{t.profileTitle}</p>
      <p className="mt-1 text-sm text-[var(--subtle)]">{t.profileBody}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        disabled={pending}
        placeholder={t.placeholder}
        className={inputClass}
      />
      <button type="button" onClick={run} disabled={pending || text.trim().length < 20} className="btn-primary btn-sm mt-3">
        {pending ? t.running : t.run}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-[var(--tone-danger-fg)]">{error}</p>}
      {notice && <p role="status" className="mt-2 text-xs text-[var(--subtle)]">{notice}</p>}
    </div>
  );
}

/** Crée des prestations en brouillon, puis recharge la liste. */
export function AiServicesPanel({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await createServicesWithAi(text);
      if ("error" in result) setError(result.error);
      else {
        setNotice(t.created(result.created));
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--border)] p-5">
      <p className="font-semibold">{t.servicesTitle}</p>
      <p className="mt-1 text-sm text-[var(--subtle)]">{t.servicesBody}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        disabled={pending}
        placeholder={t.placeholder}
        className={inputClass}
      />
      <button type="button" onClick={run} disabled={pending || text.trim().length < 20} className="btn-primary btn-sm mt-3">
        {pending ? t.running : t.run}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-[var(--tone-danger-fg)]">{error}</p>}
      {notice && <p role="status" className="mt-2 text-xs text-[var(--subtle)]">{notice}</p>}
    </div>
  );
}
