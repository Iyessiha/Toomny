"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitVerification } from "@/app/(fr)/dashboard/verification/actions";
import { KYC_COUNTRIES } from "@/lib/kyc";
import { getKycTexts } from "@/i18n/kyc";
import { countryNames } from "@/i18n/auth";
import { DOCUMENT_TYPES } from "@/lib/kyc";
import { KycSelfieGuide } from "@/components/dashboard/kyc-selfie-guide";
import type { Locale } from "@/i18n/dictionaries";

const COUNTRIES = KYC_COUNTRIES;

// Calculée au chargement du module : évite un appel impur pendant le rendu.
const MAX_DOB = new Date(Date.UTC(new Date().getUTCFullYear() - 18, new Date().getUTCMonth(), new Date().getUTCDate()))
  .toISOString()
  .split("T")[0];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-[var(--subtle)]">{hint}</p>}
      {children}
    </div>
  );
}

function FileInput({
  id,
  label,
  hint,
  accept,
  required,
  onChange,
  fileName,
  preview,
  texts,
}: {
  texts: { chooseFile: string; fileSelected: string; preview: string };
  id: string;
  label: string;
  hint: string;
  accept: string;
  required?: boolean;
  onChange: (f: File | null) => void;
  fileName: string | null;
  preview?: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="mt-0.5 text-xs text-[var(--subtle)]">{hint}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-2 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm transition-colors hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)]"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={texts.preview} className="h-14 w-14 rounded-lg object-cover shrink-0 border border-[var(--border)]" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--border)]">
            <svg className="h-5 w-5 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
        )}
        <span className={`text-left text-sm ${fileName ? "text-[var(--foreground)]" : "text-[var(--subtle)]"}`}>
          {fileName ?? texts.chooseFile}
          {fileName && <span className="block text-xs text-[var(--color-brand-600)]">{texts.fileSelected}</span>}
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        id={id}
        name={id}
        accept={accept}
        required={required}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onChange(f);
        }}
      />
    </div>
  );
}

export function KycForm({
  defaultFirstName,
  defaultLastName,
  locale = "fr",
}: {
  defaultFirstName?: string | null;
  defaultLastName?: string | null;
  locale?: Locale;
}) {
  const t = getKycTexts(locale).form;
  const names = countryNames[locale];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  function handleFileChange(
    setter: (f: File | null) => void,
    previewSetter: (s: string | null) => void,
  ) {
    return (f: File | null) => {
      setter(f);
      if (f && f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        previewSetter(url);
      } else {
        previewSetter(null);
      }
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    if (frontFile) form.set("front", frontFile);
    if (backFile) form.set("back", backFile);
    if (selfieFile) form.set("selfie", selfieFile);

    const result = await submitVerification(form);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      router.refresh();
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-500)]">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-5 font-display text-lg font-bold">{t.sentTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">
          {t.sentBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="notice notice-danger">
          {error}
        </div>
      )}

      {/* Identité civile déclarée */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          {t.sectionIdentity}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.firstName} htmlFor="declared_first_name">
            <input
              id="declared_first_name"
              name="declared_first_name"
              required
              defaultValue={defaultFirstName ?? ""}
              placeholder={t.firstPlaceholder}
              className={inputClass}
            />
          </Field>
          <Field label={t.lastName} htmlFor="declared_last_name">
            <input
              id="declared_last_name"
              name="declared_last_name"
              required
              defaultValue={defaultLastName ?? ""}
              placeholder={t.lastPlaceholder}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label={t.dob}
            hint={t.dobHint}
            htmlFor="declared_dob"
          >
            <input
              id="declared_dob"
              name="declared_dob"
              type="date"
              required
              max={MAX_DOB}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* Type et pays du document */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          {t.sectionDocument}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.docType} htmlFor="documentType">
            <select id="documentType" name="documentType" required className={inputClass}>
              <option value="">{t.choose}</option>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{getKycTexts(locale).docTypes[d.value] ?? d.label}</option>
              ))}
            </select>
          </Field>
          <Field label={t.country} htmlFor="documentCountry">
            <select id="documentCountry" name="documentCountry" required className={inputClass}>
              <option value="">{t.choose}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{names[c.code] ?? c.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Upload des photos */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          {t.sectionPhotos}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <FileInput
            texts={t}
            id="front"
            label={t.front}
            hint={t.frontHint}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            onChange={handleFileChange(setFrontFile, setFrontPreview)}
            fileName={frontFile?.name ?? null}
            preview={frontPreview}
          />
          <FileInput
            texts={t}
            id="back"
            label={t.back}
            hint={t.backHint}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            onChange={handleFileChange(setBackFile, setBackPreview)}
            fileName={backFile?.name ?? null}
            preview={backPreview}
          />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <KycSelfieGuide locale={locale} />
          </div>
          <FileInput
            texts={t}
            id="selfie"
            label={t.selfie}
            hint={t.selfieHint}
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={handleFileChange(setSelfieFile, setSelfiePreview)}
            fileName={selfieFile?.name ?? null}
            preview={selfiePreview}
          />
        </div>

        {/* Tips qualité photo */}
        <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs text-[var(--subtle)]">
          {[
            ...t.tips,
          ].map((tip) => (
            <div key={tip.text} className="flex items-start gap-2 rounded-lg bg-[var(--surface)] px-3 py-2">
              <span>{tip.icon}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mentions légales */}
      <div className="notice notice-info">
        <strong>{t.privacyTitle}</strong> {t.privacy}
      </div>

      <button
        type="submit"
        disabled={loading || !frontFile || !backFile || !selfieFile}
        className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  );
}
