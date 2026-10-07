"use client";

import { useState } from "react";
import Image from "next/image";
import {
  approveVerification,
  rejectVerification,
  flagForManualReview,
  getKycSignedUrls,
} from "@/app/(fr)/admin/verifications/actions";
import { DOCUMENT_TYPES, VERIFICATION_STATUS_FR, VERIFICATION_STATUS_TONE } from "@/lib/kyc";

type VerifRow = {
  id: string;
  status: string;
  document_type: string;
  document_country: string;
  storage_path: string;
  rejection_reason: string | null;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    email: string;
    country_code: string;
    role: string;
  } | null;
};

export function KycReviewCard({ verif }: { verif: VerifRow }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [docs, setDocs] = useState<{ frontUrl?: string; selfieUrl?: string } | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const docLabel =
    DOCUMENT_TYPES.find((d) => d.value === verif.document_type)?.label ?? verif.document_type;

  async function handleApprove() {
    setLoading("approve");
    setMessage(null);
    const r = await approveVerification(verif.id);
    if (r.error) setMessage({ type: "err", text: r.error });
    else setMessage({ type: "ok", text: "Dossier approuvé." });
    setLoading(null);
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading("reject");
    setMessage(null);
    const r = await rejectVerification(verif.id, rejectReason.trim());
    if (r.error) setMessage({ type: "err", text: r.error });
    else setMessage({ type: "ok", text: "Dossier rejeté." });
    setLoading(null);
    setShowRejectForm(false);
  }

  async function handleFlag() {
    setLoading("flag");
    setMessage(null);
    await flagForManualReview(verif.id);
    setMessage({ type: "ok", text: "Marqué pour revue manuelle." });
    setLoading(null);
  }

  async function handleViewDocs() {
    if (docs) { setDocs(null); return; }
    setLoadingDocs(true);
    const r = await getKycSignedUrls(verif.storage_path);
    if ("error" in r) {
      setMessage({ type: "err", text: r.error ?? "Erreur" });
    } else {
      setDocs(r);
    }
    setLoadingDocs(false);
  }

  const isDone = ["verified", "rejected"].includes(verif.status);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="font-medium">{verif.profile?.display_name ?? "—"}</p>
          <p className="text-xs text-[var(--subtle)]">{verif.profile?.email}</p>
          <p className="mt-1 text-xs text-[var(--subtle)]">
            Pays : {verif.profile?.country_code} · Rôle : {verif.profile?.role}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VERIFICATION_STATUS_TONE[verif.status]}`}>
          {VERIFICATION_STATUS_FR[verif.status] ?? verif.status}
        </span>
      </div>

      <div className="border-t border-[var(--border)] px-5 py-3 text-sm">
        <p>
          <span className="text-[var(--subtle)]">Document : </span>
          <strong>{docLabel}</strong> ({verif.document_country})
        </p>
        <p className="mt-1">
          <span className="text-[var(--subtle)]">Soumis le : </span>
          {new Date(verif.created_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
        {verif.rejection_reason && (
          <p className="mt-1 text-red-600">
            <span className="font-medium">Motif de rejet : </span>{verif.rejection_reason}
          </p>
        )}
      </div>

      {/* Visualiser les documents */}
      <div className="border-t border-[var(--border)] px-5 py-3">
        <button
          type="button"
          onClick={handleViewDocs}
          disabled={loadingDocs}
          className="text-sm font-medium text-[var(--color-brand-600)] hover:underline disabled:opacity-50"
        >
          {loadingDocs ? "Chargement..." : docs ? "Masquer les documents" : "Voir les documents"}
        </button>

        {docs && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {docs.frontUrl && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--subtle)] uppercase tracking-wide">Recto</p>
                <a href={docs.frontUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={docs.frontUrl}
                    alt="Recto du document"
                    className="w-full rounded-xl border border-[var(--border)] object-contain max-h-64"
                    onError={(e) => {
                      // PDF : afficher lien direct
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const p = document.createElement("p");
                      p.className = "text-sm text-[var(--color-brand-600)] underline";
                      p.textContent = "Ouvrir le fichier (PDF)";
                      el.parentElement?.appendChild(p);
                    }}
                  />
                </a>
              </div>
            )}
            {docs.selfieUrl && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--subtle)] uppercase tracking-wide">Selfie</p>
                <a href={docs.selfieUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={docs.selfieUrl}
                    alt="Selfie avec le document"
                    className="w-full rounded-xl border border-[var(--border)] object-contain max-h-64"
                  />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isDone && (
        <div className="border-t border-[var(--border)] px-5 py-4">
          {message && (
            <p className={`mb-3 text-sm font-medium ${message.type === "ok" ? "text-[var(--color-brand-600)]" : "text-red-600"}`}>
              {message.text}
            </p>
          )}

          {!showRejectForm ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading === "approve"}
                className="rounded-full bg-[var(--color-brand-500)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)] disabled:opacity-50"
              >
                {loading === "approve" ? "En cours..." : "✓ Approuver"}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                ✕ Rejeter
              </button>
              <button
                type="button"
                onClick={handleFlag}
                disabled={loading === "flag"}
                className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                {loading === "flag" ? "..." : "⚑ Revue manuelle"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium">Motif de rejet</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex : Photo floue, document expiré, visage non visible sur le selfie..."
                rows={3}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || loading === "reject"}
                  className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading === "reject" ? "En cours..." : "Confirmer le rejet"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--subtle)] hover:text-[var(--foreground)]"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dossier traité */}
      {isDone && message && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className={`text-sm font-medium ${message.type === "ok" ? "text-[var(--color-brand-600)]" : "text-red-600"}`}>
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
}
