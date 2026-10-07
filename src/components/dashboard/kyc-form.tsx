"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitVerification } from "@/app/(fr)/dashboard/verification/actions";
import { DOCUMENT_TYPES } from "@/lib/kyc";

const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "BJ", name: "Bénin" },
  { code: "TG", name: "Togo" },
  { code: "NE", name: "Niger" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "CM", name: "Cameroun" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

function FileInput({
  id,
  label,
  hint,
  accept,
  required,
  onChange,
  fileName,
}: {
  id: string;
  label: string;
  hint: string;
  accept: string;
  required?: boolean;
  onChange: (f: File | null) => void;
  fileName: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <p className="mt-0.5 text-xs text-[var(--subtle)]">{hint}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-2 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-sm transition-colors hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)]"
      >
        <svg className="h-6 w-6 shrink-0 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <span className={fileName ? "text-[var(--foreground)]" : "text-[var(--subtle)]"}>
          {fileName ?? "Cliquez pour choisir un fichier"}
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

export function KycForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    // Ajouter les fichiers manuellement (le input est hidden)
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
          <svg className="h-7 w-7 text-[var(--color-brand-600)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-5 font-display text-lg font-bold">Documents envoyés</h3>
        <p className="mt-2 text-sm text-[var(--subtle)]">
          Notre équipe va examiner vos documents sous 24 à 48 heures. Vous
          recevrez une notification une fois la vérification terminée.
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="documentType" className="text-sm font-medium">
            Type de document
          </label>
          <select id="documentType" name="documentType" required className={inputClass}>
            <option value="">Choisir...</option>
            {DOCUMENT_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="documentCountry" className="text-sm font-medium">
            Pays de délivrance
          </label>
          <select id="documentCountry" name="documentCountry" required className={inputClass}>
            <option value="">Choisir...</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FileInput
        id="front"
        label="Recto du document"
        hint="Photo nette du recto de votre pièce d'identité. JPEG, PNG, WebP ou PDF, max 10 Mo."
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required
        onChange={setFrontFile}
        fileName={frontFile?.name ?? null}
      />

      <FileInput
        id="selfie"
        label="Selfie avec le document"
        hint="Prenez-vous en photo avec votre pièce d'identité visible à côté de votre visage."
        accept="image/jpeg,image/png,image/webp"
        required
        onChange={setSelfieFile}
        fileName={selfieFile?.name ?? null}
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Pourquoi demandons-nous cela ?</strong> La vérification d&apos;identité
        protège les prestataires et les clients contre la fraude. Vos documents sont
        stockés de manière chiffrée et ne sont accessibles qu&apos;à notre équipe de
        vérification.
      </div>

      <button
        type="submit"
        disabled={loading || !frontFile || !selfieFile}
        className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Envoi en cours..." : "Envoyer mes documents"}
      </button>
    </form>
  );
}
