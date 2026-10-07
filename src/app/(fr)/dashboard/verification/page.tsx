import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { KycForm } from "@/components/dashboard/kyc-form";
import {
  VERIFICATION_STATUS_FR,
  VERIFICATION_STATUS_TONE,
  DOCUMENT_TYPES,
} from "@/lib/kyc";

export const metadata: Metadata = { title: "Vérification d'identité · Toomny" };
export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Charger la dernière demande de l'utilisateur
  const { data: verif } = await supabase
    .from("verifications")
    .select("id, status, document_type, document_country, rejection_reason, created_at, reviewed_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const statusNow = user.verificationStatus;
  const docLabel =
    verif?.document_type
      ? DOCUMENT_TYPES.find((d) => d.value === verif.document_type)?.label ?? verif.document_type
      : null;

  return (
    <DashboardShell
      user={user}
      title="Vérification d'identité"
      subtitle="Confirmez votre identité pour débloquer toutes les fonctionnalités"
      nav={[
        { href: "/dashboard", label: "Vue d'ensemble" },
        { href: "/dashboard/verification", label: "Vérification KYC", current: true },
      ]}
    >
      <div className="mx-auto max-w-2xl">
        {/* Statut actuel */}
        {statusNow === "verified" ? (
          <div className="mb-8 flex items-start gap-4 rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
              <svg className="h-5 w-5 text-[var(--color-brand-600)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-[var(--color-brand-800)]">Identité vérifiée</p>
              <p className="mt-1 text-sm text-[var(--color-brand-700)]">
                Votre compte est entièrement vérifié. Vous pouvez recevoir vos versements.
              </p>
            </div>
          </div>
        ) : verif && ["pending", "manual_review"].includes(verif.status) ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VERIFICATION_STATUS_TONE[verif.status]}`}>
                {VERIFICATION_STATUS_FR[verif.status]}
              </span>
              <span className="text-sm text-amber-800">
                Demande soumise le{" "}
                {new Date(verif.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="mt-3 text-sm text-amber-800">
              Notre équipe examine votre dossier. Vous recevrez une réponse sous 24 à 48 heures.
            </p>
            {docLabel && (
              <p className="mt-2 text-xs text-amber-700">
                Document soumis : <strong>{docLabel}</strong> ({verif.document_country})
              </p>
            )}
          </div>
        ) : verif?.status === "rejected" ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-display font-bold text-red-800">Demande rejetée</p>
            {verif.rejection_reason && (
              <p className="mt-2 text-sm text-red-700">
                Motif : {verif.rejection_reason}
              </p>
            )}
            <p className="mt-3 text-sm text-red-700">
              Vous pouvez soumettre une nouvelle demande avec un document plus lisible.
            </p>
          </div>
        ) : null}

        {/* Afficher le formulaire si pas encore vérifié et pas de demande en cours */}
        {statusNow !== "verified" && !["pending", "manual_review"].includes(verif?.status ?? "") && (
          <>
            <div className="mb-8">
              <h2 className="font-display text-lg font-bold">Soumettre vos documents</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">
                Pour vérifier votre identité, nous avons besoin d&apos;une pièce d&apos;identité
                officielle et d&apos;un selfie. Ce processus est 100 % manuel et effectué par notre
                équipe, qui traite les documents africains avec soin.
              </p>

              {/* Étapes */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { step: "1", title: "Choisissez votre document", body: "CNI, passeport, permis ou autre pièce officielle." },
                  { step: "2", title: "Photographiez recto + selfie", body: "Photo nette en bonne lumière, toutes les informations lisibles." },
                  { step: "3", title: "Soumettez & attendez", body: "Réponse sous 24-48 h par l'équipe Toomny." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]">
                      {s.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--subtle)]">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <KycForm />
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm text-[var(--subtle)] hover:text-[var(--foreground)] underline underline-offset-4">
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
