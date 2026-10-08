"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitVerification } from "@/app/(fr)/dashboard/verification/actions";
import { DOCUMENT_TYPES, KYC_COUNTRIES } from "@/lib/kyc";

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
}: {
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
          <img src={preview} alt="Aperçu" className="h-14 w-14 rounded-lg object-cover shrink-0 border border-[var(--border)]" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--border)]">
            <svg className="h-5 w-5 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
        )}
        <span className={`text-left text-sm ${fileName ? "text-[var(--foreground)]" : "text-[var(--subtle)]"}`}>
          {fileName ?? "Cliquez pour choisir un fichier"}
          {fileName && <span className="block text-xs text-[var(--color-brand-600)]">✓ Fichier sélectionné</span>}
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
}: {
  defaultFirstName?: string | null;
  defaultLastName?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
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
        <h3 className="mt-5 font-display text-lg font-bold">Documents envoyés ✓</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">
          Notre équipe va examiner vos documents et comparer les informations sous 24 à 48 heures.
          Vous recevrez une notification une fois la vérification terminée.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Identité civile déclarée */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          1. Informations d&apos;identité
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom (tel qu'il apparaît sur le document)" htmlFor="declared_first_name">
            <input
              id="declared_first_name"
              name="declared_first_name"
              required
              defaultValue={defaultFirstName ?? ""}
              placeholder="Kofi"
              className={inputClass}
            />
          </Field>
          <Field label="Nom de famille" htmlFor="declared_last_name">
            <input
              id="declared_last_name"
              name="declared_last_name"
              required
              defaultValue={defaultLastName ?? ""}
              placeholder="Asante"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label="Date de naissance"
            hint="Telle qu'elle figure sur votre pièce d'identité"
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
          2. Type de document
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type de document" htmlFor="documentType">
            <select id="documentType" name="documentType" required className={inputClass}>
              <option value="">Choisir...</option>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Pays de délivrance" htmlFor="documentCountry">
            <select id="documentCountry" name="documentCountry" required className={inputClass}>
              <option value="">Choisir...</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Upload des photos */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          3. Photos
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <FileInput
            id="front"
            label="Recto de votre pièce d'identité"
            hint="Photo nette, bien éclairée. Toutes les informations doivent être lisibles. JPEG, PNG ou PDF · max 10 Mo."
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            onChange={handleFileChange(setFrontFile, setFrontPreview)}
            fileName={frontFile?.name ?? null}
            preview={frontPreview}
          />
          <FileInput
            id="selfie"
            label="Selfie avec le document"
            hint="Tenez votre pièce d'identité à côté de votre visage. Visage et document doivent être nets et bien éclairés."
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
            { icon: "☀️", text: "Bonne luminosité (lumière naturelle si possible)" },
            { icon: "📄", text: "Document entier visible, sans reflet ni flou" },
            { icon: "🤳", text: "Visage dégagé sur le selfie, pas de lunettes de soleil" },
          ].map((tip) => (
            <div key={tip.text} className="flex items-start gap-2 rounded-lg bg-[var(--surface)] px-3 py-2">
              <span>{tip.icon}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mentions légales */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Confidentialité.</strong> Vos documents sont stockés dans un espace privé et accessibles
        uniquement à notre équipe de vérification. Ils ne sont jamais partagés ni vendus. Nous
        vérifions visuellement que le visage sur le selfie correspond au document, et que les
        informations déclarées concordent.
      </div>

      <button
        type="submit"
        disabled={loading || !frontFile || !selfieFile}
        className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Envoi en cours..." : "Envoyer mes documents pour vérification"}
      </button>
    </form>
  );
}
