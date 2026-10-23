import Link from "next/link";
import type { Readiness } from "@/lib/account-readiness";

const copy = {
  fr: {
    title: "Votre compte",
    canPublish: "Vous pouvez publier vos prestations.",
    cannotPublish: "Vous ne pouvez pas encore publier : il manque un prérequis.",
    done: "Fait",
    todo: "À faire",
    blocking: "Requis",
    recommended: "Recommandé",
    profileLink: "Compléter mon profil",
    verifyLink: "Vérifier mon identité",
  },
  en: {
    title: "Your account",
    canPublish: "You can publish your services.",
    cannotPublish: "You cannot publish yet: a requirement is missing.",
    done: "Done",
    todo: "To do",
    blocking: "Required",
    recommended: "Recommended",
    profileLink: "Complete my profile",
    verifyLink: "Verify my identity",
  },
} as const;

/** État du compte et ce qui reste à faire, pour que le demandeur sache quoi corriger avant de répondre. */
export function ReadinessChecklist({ readiness, locale }: { readiness: Readiness; locale: "fr" | "en" }) {
  const t = copy[locale];
  const todo = readiness.checks.filter((c) => !c.ok);
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold">{t.title}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${readiness.canPublish ? "bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]" : "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]"}`}>
          {readiness.canPublish ? t.canPublish : t.cannotPublish}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {readiness.checks.map((c) => (
          <li key={c.key} className="flex items-start gap-3 text-sm">
            <span aria-hidden className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${c.ok ? "bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]" : "bg-[var(--surface)] text-[var(--subtle)]"}`}>
              {c.ok ? "✓" : "·"}
            </span>
            <div className="min-w-0">
              <p className="font-medium">
                {c.label}{" "}
                <span className="text-xs font-normal text-[var(--subtle)]">
                  {c.ok ? t.done : c.blocking ? `${t.todo} · ${t.blocking}` : `${t.todo} · ${t.recommended}`}
                </span>
              </p>
              {!c.ok && <p className="text-xs text-[var(--subtle)]">{c.hint}</p>}
            </div>
          </li>
        ))}
      </ul>
      {todo.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {todo.some((c) => c.key === "identity") && (
            <Link href="/dashboard/verification" className="btn-ghost btn-sm">{t.verifyLink}</Link>
          )}
          {todo.some((c) => ["headline", "bio", "city", "skills", "avatar"].includes(c.key)) && (
            <Link href="/dashboard/profil" className="btn-ghost btn-sm">{t.profileLink}</Link>
          )}
        </div>
      )}
    </section>
  );
}
