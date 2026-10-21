"use client";

import { useState, useEffect, useTransition } from "react";
import { completeOnboarding } from "@/app/(fr)/dashboard/onboarding/actions";
import type { UserRole } from "@/lib/auth";
import type { Locale } from "@/i18n/dictionaries";

type Step = {
  icon: React.ReactNode;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
};

const CLIENT_STEPS: Step[] = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    titleFr: "Trouvez le bon prestataire",
    titleEn: "Find the right provider",
    bodyFr: "Parcourez le catalogue, filtrez par catégorie et consultez les avis pour choisir le meilleur prestataire.",
    bodyEn: "Browse the catalogue, filter by category and read reviews to choose the best provider.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    titleFr: "Passez votre commande",
    titleEn: "Place your order",
    bodyFr: "Décrivez votre besoin, confirmez votre commande et payez en toute sécurité — le paiement est conservé jusqu'à la livraison.",
    bodyEn: "Describe your need, confirm your order and pay securely — payment is held until delivery.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    titleFr: "Échangez sur la plateforme",
    titleEn: "Communicate on the platform",
    bodyFr: "Utilisez le chat intégré pour tous vos échanges. Ne partagez jamais votre numéro ou e-mail — votre paiement est protégé tant que vous restez sur Toomny.",
    bodyEn: "Use the built-in chat for all communication. Never share your phone or email — your payment is protected as long as you stay on Toomny.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    ),
    titleFr: "Validez et évaluez",
    titleEn: "Approve and review",
    bodyFr: "Une fois le travail livré, validez pour libérer le paiement et laissez un avis pour aider la communauté.",
    bodyEn: "Once the work is delivered, approve it to release payment and leave a review to help the community.",
  },
];

const PROVIDER_STEPS: Step[] = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    titleFr: "Créez votre profil",
    titleEn: "Build your profile",
    bodyFr: "Ajoutez une photo, une présentation et vos compétences. Un profil complet reçoit jusqu'à 3× plus de commandes.",
    bodyEn: "Add a photo, a bio and your skills. A complete profile receives up to 3× more orders.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    titleFr: "Publiez vos services",
    titleEn: "Publish your services",
    bodyFr: "Créez un ou plusieurs services avec un titre clair, un prix et un délai. La publication est gratuite.",
    bodyEn: "Create one or more services with a clear title, a price and a delivery time. Publishing is free.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    titleFr: "Travaillez sur la plateforme",
    titleEn: "Work on the platform",
    bodyFr: "Toutes vos communications doivent rester dans le chat Toomny. Ne donnez jamais votre numéro directement — c'est votre protection.",
    bodyEn: "All your communications must stay in the Toomny chat. Never give your number directly — it's your protection.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    titleFr: "Recevez sur Wave / Orange Money",
    titleEn: "Get paid via Wave / Orange Money",
    bodyFr: "Configurez votre numéro mobile money dans vos versements. Dès la validation du client, le virement est déclenché automatiquement.",
    bodyEn: "Set up your mobile money number in payouts. Once the client approves, the transfer is triggered automatically.",
  },
];

export function OnboardingModal({
  role,
  locale,
}: {
  role: UserRole;
  locale: Locale;
}) {
  // Les comptes « both » sont aussi prestataires : ils reçoivent le parcours prestataire.
  const steps = role === "provider" || role === "both" ? PROVIDER_STEPS : CLIENT_STEPS;
  const [step, setStep] = useState(0);
  const [closed, setClosed] = useState(false);
  const [, startTransition] = useTransition();

  // Marquer comme vu dès l'affichage : si l'user ferme l'onglet sans cliquer
  // "C'est parti", le modal ne réapparaît pas à la prochaine visite.
  useEffect(() => {
    startTransition(async () => { await completeOnboarding(); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLast = step === steps.length - 1;
  const current = steps[step];
  const t = locale === "en"
    ? { next: "Next", finish: "Get started", skip: "Skip" }
    : { next: "Suivant", finish: "C'est parti !", skip: "Passer" };

  function finish() {
    setClosed(true);
    startTransition(async () => {
      await completeOnboarding();
    });
  }

  // Échap ferme l'onboarding comme le bouton « Passer ».
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (closed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
        {/* En-tête */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-500)]">
              {locale === "en" ? "Getting started" : "Prise en main"}
            </span>
            <button
              onClick={finish}
              className="text-xs text-[var(--subtle)] hover:text-[var(--foreground)]"
            >
              {t.skip}
            </button>
          </div>

          {/* Icône de l'étape */}
          <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
            {current.icon}
          </div>

          <h2 id="onboarding-title" className="mt-5 font-display text-xl font-bold leading-tight">
            {locale === "en" ? current.titleEn : current.titleFr}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--subtle)]">
            {locale === "en" ? current.bodyEn : current.bodyFr}
          </p>
        </div>

        {/* Indicateurs de progression */}
        <div className="flex items-center justify-center gap-2 px-8 pb-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-[var(--color-brand-500)]"
                  : i < step
                  ? "w-3 bg-[var(--color-brand-300)]"
                  : "w-3 bg-[var(--border)]"
              }`}
              aria-label={`Étape ${i + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 px-8 pb-8 pt-5">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface)] disabled:invisible"
          >
            ←
          </button>

          {isLast ? (
            <button
              onClick={finish}
              className="flex-1 rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] active:scale-95"
            >
              {t.finish}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="flex-1 rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] active:scale-95"
            >
              {t.next} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
