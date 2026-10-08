"use client";

import { useState } from "react";
import Image from "next/image";
import {
  approveVerification,
  rejectVerification,
  flagForManualReview,
  getKycSignedUrls,
} from "@/app/(fr)/admin/verifications/actions";
import { DOCUMENT_TYPES, VERIFICATION_STATUS_TONE } from "@/lib/kyc";
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
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="font-medium">{verif.profile?.display_name ?? "—"}</p>
          <p className="text-xs text-[var(--subtle)]">{verif.profile?.email}</p>
          <p className="mt-1 text-xs text-[var(--subtle)]">
            {a.country} {verif.profile?.country_code} · {a.role} {getAdminTexts(locale).roles[verif.profile?.role ?? ""] ?? verif.profile?.role}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VERIFICATION_STATUS_TONE[verif.status]}`}>
          {statusLabel[verif.status] ?? verif.status}
        </span>
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
          <p className="text-red-600">
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
          className="text-sm font-medium text-[var(--color-brand-600)] hover:underline disabled:opacity-50"
        >
          {loadingDocs ? a.loading : docs ? a.hideDocs : a.viewDocs}
        </button>

        {docs && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {docs.frontUrl && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--subtle)] uppercase tracking-wide">{a.front}</p>
                <a href={docs.frontUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={docs.frontUrl}
                    alt={a.front}
                    className="w-full rounded-xl border border-[var(--border)] object-contain max-h-64"
                    onError={(e) => {
                      // PDF : afficher lien direct
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const p = document.createElement("p");
                      p.className = "text-sm text-[var(--color-brand-600)] underline";
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
                {loading === "approve" ? a.approving : a.approve}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                {a.reject}
              </button>
              <button
                type="button"
                onClick={handleFlag}
                disabled={loading === "flag"}
                className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
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
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || loading === "reject"}
                  className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading === "reject" ? a.rejecting : a.confirmReject}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--subtle)] hover:text-[var(--foreground)]"
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
          <p className={`text-sm font-medium ${message.type === "ok" ? "text-[var(--color-brand-600)]" : "text-red-600"}`}>
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
}
