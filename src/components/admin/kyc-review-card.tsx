"use client";

import { useState } from "react";
import Image from "next/image";
import {
  approveVerification,
  rejectVerification,
  flagForManualReview,
  getKycSignedUrls,
  analyzeKycDossier,
} from "@/app/(fr)/admin/verifications/actions";
import type { KycAiReview } from "@/lib/ai/kyc-review";
import { DOCUMENT_TYPES } from "@/lib/kyc";
import { Pill, kycTone } from "@/components/dashboard/pro";
import { getAdminTexts } from "@/i18n/admin";
import { getKycTexts } from "@/i18n/kyc";
import type { Locale } from "@/i18n/dictionaries";

type VerifRow = {
  id: string;
  status: string;
  document_type: string;
  document_country: string;
  storage_path: string;
  rejection_reason: string | null;
  declared_first_name: string | null;
  declared_last_name: string | null;
  declared_dob: string | null;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    email: string;
    country_code: string;
    role: string;
  } | null;
};

export function KycReviewCard({ verif, locale = "fr" }: { verif: VerifRow; locale?: Locale }) {
  const a = getAdminTexts(locale).kycCard;
  const statusLabel = getKycTexts(locale).statusLabels;
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [docs, setDocs] = useState<{ frontUrl?: string; selfieUrl?: string } | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [aiReview, setAiReview] = useState<KycAiReview | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fr = locale !== "en";

  async function handleAiReview() {
    setAiLoading(true);
    setAiError(null);
    const r = await analyzeKycDossier(verif.id);
    setAiLoading(false);
    if ("error" in r) {
      setAiReview(null);
      setAiError(r.error);
      return;
    }
    setAiReview(r.review);
  }

  const verdictLabel: Record<KycAiReview["verdict"], string> = fr
    ? { clear: "Dossier cohérent", review: "À vérifier à la main", unreadable: "Illisible" }
    : { clear: "Consistent file", review: "Check manually", unreadable: "Unreadable" };
  const verdictTone: Record<KycAiReview["verdict"], string> = {
    clear: "text-[var(--tone-success-fg)]",
    review: "text-[var(--tone-warning-fg,var(--tone-danger-fg))]",
    unreadable: "text-[var(--tone-danger-fg)]",
  };

  const docLabel =
    getKycTexts(locale).docTypes[verif.document_type] ??
    DOCUMENT_TYPES.find((d) => d.value === verif.document_type)?.label ??
    verif.document_type;

  async function handleApprove() {
    setLoading("approve");
    setMessage(null);
    const r = await approveVerification(verif.id);
    if (r.error) setMessage({ type: "err", text: r.error });
    else setMessage({ type: "ok", text: a.success.approved });
    setLoading(null);
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading("reject");
    setMessage(null);
    const r = await rejectVerification(verif.id, rejectReason.trim());
    if (r.error) setMessage({ type: "err", text: r.error });
    else setMessage({ type: "ok", text: a.success.rejected });
    setLoading(null);
    setShowRejectForm(false);
  }

  async function handleFlag() {
    setLoading("flag");
    setMessage(null);
    await flagForManualReview(verif.id);
    setMessage({ type: "ok", text: a.success.flagged });
    setLoading(null);
  }

  async function handleViewDocs() {
    if (docs) { setDocs(null); return; }
    setLoadingDocs(true);
    const r = await getKycSignedUrls(verif.storage_path);
    if ("error" in r) {
      setMessage({ type: "err", text: r.error ?? a.error });
    } else {
      setDocs(r);
    }
    setLoadingDocs(false);
  }

  const isDone = ["verified", "rejected"].includes(verif.status);

  return (
    <div className="card overflow-hidden">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="font-medium">{verif.profile?.display_name ?? "—"}</p>
          <p className="text-xs text-[var(--subtle)]">{verif.profile?.email}</p>
          <p className="mt-1 text-xs text-[var(--subtle)]">
            {a.country} {verif.profile?.country_code} · {a.role} {getAdminTexts(locale).roles[verif.profile?.role ?? ""] ?? verif.profile?.role}
          </p>
        </div>
        <Pill tone={kycTone(verif.status)}>{statusLabel[verif.status] ?? verif.status}</Pill>
      </div>

      <div className="border-t border-[var(--border)] px-5 py-3 text-sm space-y-1.5">
        {/* Informations déclarées — à comparer avec les documents */}
        {(verif.declared_first_name || verif.declared_last_name) && (
          <p>
            <span className="text-[var(--subtle)]">{a.declaredIdentity} </span>
            <strong>{[verif.declared_first_name, verif.declared_last_name].filter(Boolean).join(" ")}</strong>
          </p>
        )}
        {verif.declared_dob && (
          <p>
            <span className="text-[var(--subtle)]">{a.birthDate} </span>
            <strong>
              {new Date(verif.declared_dob).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </strong>
          </p>
        )}
        <p>
          <span className="text-[var(--subtle)]">{a.document} </span>
          <strong>{docLabel}</strong> ({verif.document_country})
        </p>
        <p>
          <span className="text-[var(--subtle)]">{a.submittedOn} </span>
          {new Date(verif.created_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
        {verif.rejection_reason && (
          <p className="text-[var(--tone-danger-fg)]">
            <span className="font-medium">{a.rejectionReason} </span>{verif.rejection_reason}
          </p>
        )}
      </div>

      {/* Visualiser les documents */}
      <div className="border-t border-[var(--border)] px-5 py-3">
        <button
          type="button"
          onClick={handleViewDocs}
          disabled={loadingDocs}
          className="text-sm font-medium text-[var(--brand-text-1)] hover:underline disabled:opacity-50"
        >
          {loadingDocs ? a.loading : docs ? a.hideDocs : a.viewDocs}
        </button>

        {docs && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {docs.frontUrl && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--subtle)] uppercase tracking-wide">{a.front}</p>
                <a href={docs.frontUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL signée éphémère + repli PDF via onError : pas d'optimiseur dessus. */}
                  <img
                    src={docs.frontUrl}
                    alt={a.front}
                    className="w-full rounded-xl border border-[var(--border)] object-contain max-h-64"
                    onError={(e) => {
                      // PDF : afficher lien direct
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const p = document.createElement("p");
                      p.className = "text-sm text-[var(--brand-text-1)] underline";
                      p.textContent = a.openPdf;
                      el.parentElement?.appendChild(p);
                    }}
                  />
                </a>
              </div>
            )}
            {docs.selfieUrl && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--subtle)] uppercase tracking-wide">{a.selfie}</p>
                <a href={docs.selfieUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL signée éphémère : pas d'optimiseur dessus. */}
                  <img
                    src={docs.selfieUrl}
                    alt={a.selfie}
                    className="w-full rounded-xl border border-[var(--border)] object-contain max-h-64"
                  />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avis de l'IA : aide à la lecture, aucune décision */}
      {!isDone && (
        <div className="border-t border-[var(--border)] px-5 py-3 space-y-2">
          <button
            type="button"
            onClick={handleAiReview}
            disabled={aiLoading}
            className="text-sm font-medium text-[var(--brand-text-1)] hover:underline disabled:opacity-50"
          >
            {aiLoading ? (fr ? "Analyse en cours…" : "Analyzing…") : fr ? "Analyser avec l'IA" : "Analyze with AI"}
          </button>
          {aiError && <p role="alert" className="text-sm text-[var(--tone-danger-fg)]">{aiError}</p>}
          {aiReview && (
            <div className="rounded-xl bg-[var(--surface)] p-3 text-sm space-y-2">
              <p className={`font-semibold ${verdictTone[aiReview.verdict]}`}>
                {verdictLabel[aiReview.verdict]}
              </p>
              {aiReview.summary && <p>{aiReview.summary}</p>}
              {aiReview.findings.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {aiReview.findings.map((f, i) => (
                    <li key={i} className={f.severity === "blocking" ? "text-[var(--tone-danger-fg)]" : ""}>
                      {f.message}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-[var(--subtle)]">
                {fr
                  ? "Avis indicatif : la décision reste la vôtre."
                  : "Indicative opinion: the decision is yours."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!isDone && (
        <div className="border-t border-[var(--border)] px-5 py-4">
          {message && (
            <p className={`mb-3 text-sm font-medium ${message.type === "ok" ? "text-[var(--tone-success-fg)]" : "text-[var(--tone-danger-fg)]"}`}>
              {message.text}
            </p>
          )}

          {!showRejectForm ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading === "approve"}
                className="btn-primary disabled:opacity-50"
              >
                {loading === "approve" ? a.approving : a.approve}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="btn-ghost"
              >
                {a.reject}
              </button>
              <button
                type="button"
                onClick={handleFlag}
                disabled={loading === "flag"}
                className="btn-ghost disabled:opacity-50"
              >
                {loading === "flag" ? a.flagging : a.flag}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium">{a.rejectReason}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={a.rejectReasonPlaceholder}
                rows={3}
                className="input bg-[var(--surface)]"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || loading === "reject"}
                  className="btn-danger disabled:opacity-50"
                >
                  {loading === "reject" ? a.rejecting : a.confirmReject}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="btn-ghost"
                >
                  {a.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dossier traité */}
      {isDone && message && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className={`text-sm font-medium ${message.type === "ok" ? "text-[var(--tone-success-fg)]" : "text-[var(--tone-danger-fg)]"}`}>
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
}
