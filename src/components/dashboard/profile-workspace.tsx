"use client";

import { useState } from "react";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { AiProfilePanel, AiUpsell } from "@/components/dashboard/ai-assist";
import { mergeProfileDraft, type ProfileDraft } from "@/lib/profile-draft";
import type { Locale } from "@/i18n/dictionaries";

type Defaults = React.ComponentProps<typeof ProfileForm>["defaults"];

/**
 * Profil + assistant IA. Un brouillon IA fusionne dans les valeurs du
 * formulaire ; `version` remonte le formulaire pour afficher ces valeurs.
 */
export function ProfileWorkspace({
  defaults,
  publicPath,
  locale,
  hasAiAccess,
}: {
  defaults: Defaults;
  publicPath: string;
  locale: Locale;
  hasAiAccess: boolean;
}) {
  const [current, setCurrent] = useState<Defaults>(defaults);
  const [version, setVersion] = useState(0);

  function applyDraft(draft: ProfileDraft) {
    setCurrent((prev) => {
      const merged = mergeProfileDraft(
        {
          headline: prev.headline,
          bio: prev.bio,
          city: prev.city,
          skills: prev.skills ?? "",
          spokenLanguages: prev.spokenLanguages ?? "",
        },
        draft,
      );
      return { ...prev, ...merged, skills: merged.skills, spokenLanguages: merged.spokenLanguages };
    });
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      {hasAiAccess ? <AiProfilePanel locale={locale} onDraft={applyDraft} /> : <AiUpsell locale={locale} />}
      <ProfileForm key={version} defaults={current} publicPath={publicPath} locale={locale} />
    </div>
  );
}
