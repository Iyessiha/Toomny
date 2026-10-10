"use client";

import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createService } from "@/app/(fr)/dashboard/prestations/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

export function ServiceForm({
  categories,
  locale = "fr",
}: {
  categories: { id: string; name: string }[];
  locale?: Locale;
}) {
  const t = getDashboardTexts(locale).services;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
    setCoverUrl(null);
    setUploadError(null);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/services/cover", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? t.form.coverError);
        setCoverPreview(null);
      } else {
        setCoverUrl(data.url);
      }
    } catch {
      setUploadError(t.form.coverError);
      setCoverPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function removeCover() {
    setCoverUrl(null);
    setCoverPreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading) return;
    setPending(true);
    setError(null);
    setDone(false);
    const result = await createService(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    setCoverUrl(null);
    setCoverPreview(null);
    setDone(true);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {/* Image de couverture */}
      <div>
        <p className="text-sm font-medium">{t.form.cover}</p>
        <input type="hidden" name="coverUrl" value={coverUrl ?? ""} />

        {coverPreview ? (
          <div className="relative mt-1.5 aspect-[16/9] overflow-hidden rounded-xl bg-[var(--surface)]">
            <Image src={coverPreview} alt="" fill className="object-cover" sizes="380px" unoptimized />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-sm font-semibold text-white">{t.form.coverUploading}</span>
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={removeCover}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-black/80"
              >
                {t.form.coverRemove}
              </button>
            )}
          </div>
        ) : (
          <label className="mt-1.5 flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="font-medium">{t.form.coverUpload}</span>
            <span className="text-xs opacity-70">{t.form.coverHint}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        )}

        {uploadError && (
          <p className="mt-1 text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="text-sm font-medium">{t.form.title}</label>
        <input id="title" name="title" required maxLength={120} placeholder={t.form.titlePlaceholder} className={inputClass} />
      </div>
      <div>
        <label htmlFor="categoryId" className="text-sm font-medium">{t.form.category}</label>
        <select id="categoryId" name="categoryId" required defaultValue="" className={inputClass}>
          <option value="" disabled>{t.form.choose}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="text-sm font-medium">{t.form.description}</label>
        <textarea
          id="description"
          name="description"
          required
          minLength={30}
          maxLength={3000}
          rows={5}
          placeholder={t.form.descriptionPlaceholder}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="text-sm font-medium">{t.form.price}</label>
          <input id="price" name="price" required inputMode="numeric" pattern="[0-9 ]+" placeholder="25000" className={inputClass} />
        </div>
        <div>
          <label htmlFor="deliveryDays" className="text-sm font-medium">{t.form.delivery}</label>
          <input id="deliveryDays" name="deliveryDays" type="number" min={1} max={365} required className={inputClass} />
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {done && <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">{t.draftSaved}</p>}

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? t.creating : t.saveDraft}
      </button>
    </form>
  );
}
