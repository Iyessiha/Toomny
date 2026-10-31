"use client";

import { TitleField } from "@/components/dashboard/title-field";
import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createService } from "@/app/(fr)/dashboard/prestations/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";
import { CoverNotLandscapeError, resizeCover } from "@/lib/resize-image";

type PackageSlot = {
  enabled: boolean;
  name: string;
  description: string;
  price: string;
  deliveryDays: string;
};

type TierNames = { pkgBasic: string; pkgStandard: string; pkgPremium: string };

/** Slots initiaux : les noms de paliers suivent la langue du prestataire. */
function defaultSlots(names: TierNames): [PackageSlot, PackageSlot, PackageSlot] {
  return [
    { enabled: false, name: names.pkgBasic, description: "", price: "", deliveryDays: "" },
    { enabled: false, name: names.pkgStandard, description: "", price: "", deliveryDays: "" },
    { enabled: false, name: names.pkgPremium, description: "", price: "", deliveryDays: "" },
  ];
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

const copy: Record<Locale, { removePhoto: string }> = {
  fr: { removePhoto: "Supprimer" },
  en: { removePhoto: "Remove" },
};

export function ServiceForm({
  categories,
  locale = "fr",
}: {
  categories: { id: string; name: string }[];
  locale?: Locale;
}) {
  const t = getDashboardTexts(locale).services;
  const c = copy[locale];
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Cover
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Gallery
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Packages
  const [pkgSlots, setPkgSlots] = useState<[PackageSlot, PackageSlot, PackageSlot]>(() =>
    defaultSlots(t.form)
  );

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    let file: File;
    try {
      file = await resizeCover(raw);
    } catch (err) {
      if (err instanceof CoverNotLandscapeError) {
        setUploadError(t.form.coverNotLandscape);
        return;
      }
      file = raw;
    }
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

  async function handleGalleryChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (galleryUrls.length >= 4) return;
    setGalleryError(null);
    setGalleryUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/services/gallery", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setGalleryError(data.error ?? t.form.galleryError);
      } else {
        setGalleryUrls((prev) => [...prev, data.url!].slice(0, 4));
      }
    } catch {
      setGalleryError(t.form.galleryError);
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function removeGalleryImage(index: number) {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, 30);
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setTags((prev) => [...prev, tag]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading) return;
    setPending(true);
    setError(null);
    setDone(false);

    const fd = new FormData(e.currentTarget);
    // Inject state-managed fields
    fd.set("coverUrl", coverUrl ?? "");
    fd.set("galleryUrls", galleryUrls.join(","));
    fd.set("tags", tags.join(","));

    // Build enabled packages JSON
    const tierFallback = [t.form.pkgBasic, t.form.pkgStandard, t.form.pkgPremium] as const;
    const enabledPackages = pkgSlots
      .map((slot, i) => ({ ...slot, tier: (i + 1) as 1 | 2 | 3 }))
      .filter((slot) => slot.enabled && slot.price && slot.deliveryDays)
      .map((slot) => ({
        tier: slot.tier,
        name: slot.name.trim() || tierFallback[slot.tier - 1],
        description: slot.description,
        price_minor: Number(slot.price.replace(/\s/g, "")),
        delivery_days: Number(slot.deliveryDays),
      }));
    fd.set("packagesJson", enabledPackages.length ? JSON.stringify(enabledPackages) : "");

    let result;
    try {
      result = await createService(fd);
    } catch {
      setPending(false);
      setError(t.errors.network);
      return;
    }
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    setCoverUrl(null);
    setCoverPreview(null);
    setGalleryUrls([]);
    setTags([]);
    setTagInput("");
    setPkgSlots(defaultSlots(t.form));
    setDone(true);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      {/* Image de couverture */}
      <div>
        <p className="text-sm font-medium">{t.form.cover}</p>
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
        {uploadError && <p className="mt-1 text-xs text-[var(--tone-danger-fg)]">{uploadError}</p>}
      </div>

      {/* Galerie */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t.form.gallery}</p>
          <span className="text-xs text-[var(--subtle)]">{galleryUrls.length}/4</span>
        </div>
        <p className="mb-2 mt-0.5 text-xs text-[var(--subtle)]">{t.form.galleryHint}</p>
        <div className="flex flex-wrap gap-2">
          {galleryUrls.map((url, i) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl bg-[var(--surface)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryImage(i)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white hover:bg-black/80"
                aria-label={c.removePhoto}
              >
                {t.form.galleryRemove}
              </button>
            </div>
          ))}
          {galleryUrls.length < 4 && (
            <label className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)] ${galleryUploading ? "pointer-events-none opacity-50" : ""}`}>
              {galleryUploading ? (
                <span className="text-[10px] font-semibold">{t.form.galleryUploading}</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] font-medium leading-tight px-1 text-center">{t.form.galleryAdd}</span>
                </>
              )}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleGalleryChange}
                disabled={galleryUploading}
              />
            </label>
          )}
        </div>
        {galleryError && <p className="mt-1 text-xs text-[var(--tone-danger-fg)]">{galleryError}</p>}
      </div>

      {/* Titre */}
      <div>
        <TitleField id="title" label={t.form.title} placeholder={t.form.titlePlaceholder} inputClassName={inputClass} />
      </div>

      {/* Catégorie */}
      <div>
        <label htmlFor="categoryId" className="text-sm font-medium">{t.form.category}</label>
        <select id="categoryId" name="categoryId" required defaultValue="" className={inputClass}>
          <option value="" disabled>{t.form.choose}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Description */}
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

      {/* Prix + délai */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="text-sm font-medium">{t.form.price}</label>
          <input id="price" name="price" required inputMode="numeric" pattern="[0-9 ]+" placeholder="25000" className={inputClass} />
        </div>
        <div>
          <label htmlFor="deliveryDays" className="text-sm font-medium">{t.form.delivery}</label>
          <input id="deliveryDays" name="deliveryDays" type="number" min={1} max={365} required className={inputClass} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-sm font-medium">{t.form.tags}</p>
        <p className="mb-2 mt-0.5 text-xs text-[var(--subtle)]">{t.form.tagsHint}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--color-brand-300)] bg-[var(--color-brand-50)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand-700)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={t.form.tagsRemove}
                className="ml-0.5 opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </span>
          ))}
          {tags.length < 10 && (
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
              onBlur={() => {
                if (tagInput.trim()) { addTag(tagInput); setTagInput(""); }
              }}
              placeholder={tags.length === 0 ? t.form.tagsPlaceholder : ""}
              className="h-7 min-w-[120px] flex-1 rounded-full border border-dashed border-[var(--border)] bg-transparent px-3 text-xs outline-none focus:border-[var(--color-brand-400)]"
            />
          )}
        </div>
      </div>

      {/* Forfaits */}
      <div>
        <p className="text-sm font-medium">{t.form.packages}</p>
        <p className="mb-3 mt-0.5 text-xs text-[var(--subtle)]">{t.form.packagesHint}</p>
        <div className="space-y-3">
          {([t.form.pkgBasic, t.form.pkgStandard, t.form.pkgPremium] as const).map((tierLabel, i) => {
            const slot = pkgSlots[i];
            return (
              <div
                key={i}
                className={`rounded-xl border p-3 ${slot.enabled ? "border-[var(--color-brand-300)] bg-[var(--color-brand-50)]" : "border-[var(--border)]"}`}
              >
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(e) =>
                      setPkgSlots((prev) => {
                        const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot];
                        next[i] = { ...next[i], enabled: e.target.checked };
                        return next;
                      })
                    }
                    className="h-4 w-4 accent-[var(--color-brand-500)]"
                  />
                  <span className="text-sm font-semibold">{tierLabel}</span>
                </label>
                {slot.enabled && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={slot.name}
                      onChange={(e) =>
                        setPkgSlots((prev) => {
                          const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot];
                          next[i] = { ...next[i], name: e.target.value };
                          return next;
                        })
                      }
                      placeholder={t.form.pkgName}
                      maxLength={60}
                      className={inputClass}
                    />
                    <textarea
                      value={slot.description}
                      onChange={(e) =>
                        setPkgSlots((prev) => {
                          const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot];
                          next[i] = { ...next[i], description: e.target.value };
                          return next;
                        })
                      }
                      placeholder={t.form.pkgDescPlaceholder}
                      maxLength={500}
                      rows={2}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={slot.price}
                        onChange={(e) =>
                          setPkgSlots((prev) => {
                            const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot];
                            next[i] = { ...next[i], price: e.target.value };
                            return next;
                          })
                        }
                        placeholder={t.form.pkgPrice}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={slot.deliveryDays}
                        onChange={(e) =>
                          setPkgSlots((prev) => {
                            const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot];
                            next[i] = { ...next[i], deliveryDays: e.target.value };
                            return next;
                          })
                        }
                        placeholder={t.form.pkgDelivery}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p role="alert" className="notice notice-danger">{error}</p>}
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
