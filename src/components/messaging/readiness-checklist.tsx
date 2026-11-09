import Link from "next/link";
import type { Readiness } from "@/lib/account-readiness";

const copy = {
  fr: {
    yourTitle: "Votre compte",
    requesterTitle: "Compte du demandeur",
    canPublish: "Peut publier ses prestations",
    cannotPublish: "Ne peut pas encore publier",
    done: "Fait",
    todo: "À faire",
    blocking: "Requis",
    recommended: "Recommandé",
    profileLink: "Compléter mon profil",
    verifyLink: "Vérifier mon identité",
    notify: "Envoyer les éléments manquants au prestataire",
    notifyHint: "Le prestataire reçoit une notification avec la liste à compléter.",
    allDone: "Rien à compléter.",
  },
  en: {
    yourTitle: "Your account",
    requesterTitle: "Requester's account",
    canPublish: "Can publish services",
    cannotPublish: "Cannot publish yet",
    done: "Done",
    todo: "To do",
    blocking: "Required",
    recommended: "Recommended",
    profileLink: "Complete my profile",
    verifyLink: "Verify my identity",
    notify: "Send the missing items to the provider",
    notifyHint: "The provider receives a notification with the list to complete.",
    allDone: "Nothing to complete.",
  },
} as const;

/**
 * État d'un compte et ce qui reste à faire. Sur la messagerie de l'équipe, le bloc
 * se replie et propose d'envoyer les éléments manquants au prestataire.
 */
export function ReadinessChecklist({
  readiness,
  locale,
  viewer = "requester",
  collapsible = false,
  notifyAction,
  requestId,
}: {
  readiness: Readiness;
  locale: "fr" | "en";
  viewer?: "requester" | "team";
  collapsible?: boolean;
  notifyAction?: (formData: FormData) => Promise<void>;
  requestId?: string;
}) {
  const t = copy[locale];
  const title = viewer === "team" ? t.requesterTitle : t.yourTitle;
  const todo = readiness.checks.filter((c) => !c.ok);
  const status = readiness.canPublish ? t.canPublish : t.cannotPublish;
  const statusTone = readiness.canPublish
    ? "bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]"
    : "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]";

  const body = (
    <>
      <ul className="mt-3 space-y-2">
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
      {todo.length === 0 && <p className="mt-3 text-xs text-[var(--subtle)]">{t.allDone}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {viewer === "requester" && todo.some((c) => c.key === "identity") && (
          <Link href="/dashboard/verification" className="btn-ghost btn-sm">{t.verifyLink}</Link>
        )}
        {viewer === "requester" && todo.some((c) => ["headline", "bio", "city", "skills", "avatar"].includes(c.key)) && (
          <Link href="/dashboard/profil" className="btn-ghost btn-sm">{t.profileLink}</Link>
        )}
        {viewer === "team" && notifyAction && requestId && todo.length > 0 && (
          <form action={notifyAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="requestId" value={requestId} />
            <button type="submit" className="btn-primary btn-sm">{t.notify}</button>
            <span className="text-[11px] text-[var(--subtle)]">{t.notifyHint}</span>
          </form>
        )}
      </div>
    </>
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-display text-sm font-bold">{title}</h2>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone}`}>{status}</span>
    </div>
  );

  if (collapsible) {
    return (
      <details className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
        <summary className="cursor-pointer list-none">{header}</summary>
        {body}
      </details>
    );
  }
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
      {header}
      {body}
    </section>
  );
}
