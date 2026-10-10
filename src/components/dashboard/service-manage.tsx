"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  updateService,
  deleteService,
  toggleServiceStatus,
  upsertPackages,
} from "@/app/(fr)/dashboard/prestations/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import { EmptyState } from "@/components/dashboard/shell";
import type { Locale } from "@/i18n/dictionaries";
import { resizeCover } from "@/lib/resize-image";

type Service = {
  id: string;
  title: string;
  description: string | null;
  price_minor: number;
  currency: string;
  delivery_days: number;
  status: string;
  category_id: string | null;
  cover_url: string | null;
  gallery_urls: string[] | null;
  tags: string[] | null;
};

type PackageRow = {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  description: string | null;
  price_minor: number;
  delivery_days: number;
  currency: string;
};

type PackageSlot = {
  enabled: boolean;
  name: string;
  description: string;
  price: string;
  deliveryDays: string;
};

const DEFAULT_SLOTS: [PackageSlot, PackageSlot, PackageSlot] = [
  { enabled: false, name: "Basique", description: "", price: "", deliveryDays: "" },
  { enabled: false, name: "Standard", description: "", price: "", deliveryDays: "" },
  { enabled: false, name: "Premium", description: "", price: "", deliveryDays: "" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

function statusBadgeClass(status: string) {
  if (status === "active") return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
  if (status === "paused") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
  if (status === "removed") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  return "bg-[var(--surface)] text-[var(--subtle)]";
}

export function ServiceManage({
  services,
  categories,
  locale = "fr",
  packagesByService = {},
}: {
  services: Service[];
  categories: { id: string; name: string }[];
  locale?: Locale;
  packagesByService?: Record<string, PackageRow[]>;
}) {
  const t = getDashboardTexts(locale).services;
  const statusLabels = getDashboardTexts(locale).service;
  const router = useRouter();

  const [editing, setEditing] = useState<Service | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Gallery
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Packages (3 slots: Basic, Standard, Premium)
  const [pkgSlots, setPkgSlots] = useState<[PackageSlot, PackageSlot, PackageSlot]>([...DEFAULT_SLOTS] as [PackageSlot, PackageSlot, PackageSlot]);

  function openEdit(s: Service) {
    setEditing(s);
    setCoverUrl(s.cover_url);
    setCoverPreview(s.cover_url);
    setGalleryUrls(s.gallery_urls ?? []);
    setTags(s.tags ?? []);
    setTagInput("");
    setGalleryError(null);
    setError(null);
    setSuccess(null);
    setUploadError(null);
    // Init package slots from existing packages — pré-cocher et pré-remplir si vide
    const existing = packagesByService[s.id] ?? [];
    const basePrice = s.price_minor;
    const baseDays = s.delivery_days;
    setPkgSlots([1, 2, 3].map((tier) => {
      const pkg = existing.find((p) => p.tier === tier);
      if (pkg) return { enabled: true, name: pkg.name, description: pkg.description ?? "", price: String(pkg.price_minor), deliveryDays: String(pkg.delivery_days) };
      // Aucun forfait existant → pré-remplir avec des valeurs suggérées
      const multiplierPrice = tier === 1 ? 0.6 : tier === 2 ? 1.0 : 1.5;
      const multiplierDays = tier === 1 ? 0.8 : tier === 2 ? 1.0 : 1.4;
      const suggestedPrice = Math.round((basePrice * multiplierPrice) / 5000) * 5000 || basePrice;
      const suggestedDays = Math.max(1, Math.round(baseDays * multiplierDays));
      const defaultName = tier === 1 ? (locale === "en" ? "Basic" : "Essentiel") : tier === 2 ? "Standard" : "Premium";
      return { enabled: true, name: defaultName, description: "", price: String(suggestedPrice), deliveryDays: String(suggestedDays) };
    }) as [PackageSlot, PackageSlot, PackageSlot]);
  }

  function closeEdit() {
    setEditing(null);
    setCoverUrl(null);
    setCoverPreview(null);
    setGalleryUrls([]);
    setTags([]);
    setTagInput("");
    setPkgSlots([...DEFAULT_SLOTS] as [PackageSlot, PackageSlot, PackageSlot]);
    setGalleryError(null);
    setError(null);
    setSuccess(null);
  }

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, 30);
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setTags((prev) => [...prev, tag]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    let file: File;
    try {
      file = await resizeCover(raw);
    } catch {
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
        setCoverPreview(editing?.cover_url ?? null);
      } else {
        setCoverUrl(data.url);
      }
    } catch {
      setUploadError(t.form.coverError);
      setCoverPreview(editing?.cover_url ?? null);
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

  async function onEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || uploading) return;
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    // Build enabled packages
    const enabledPackages = pkgSlots
      .map((slot, i) => ({ ...slot, tier: (i + 1) as 1 | 2 | 3 }))
      .filter((slot) => slot.enabled && slot.price && slot.deliveryDays)
      .map((slot) => ({
        tier: slot.tier,
        name: slot.name.trim() || (slot.tier === 1 ? "Basique" : slot.tier === 2 ? "Standard" : "Premium"),
        description: slot.description,
        price_minor: Number(slot.price.replace(/\s/g, "")),
        delivery_days: Number(slot.deliveryDays),
      }));

    const [result, pkgResult] = await Promise.all([
      updateService(editing.id, fd),
      upsertPackages(editing.id, enabledPackages),
    ]);
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("error" in pkgResult && pkgResult.error) {
      setError(pkgResult.error);
    } else {
      setSuccess(t.updated);
      router.refresh();
      setTimeout(closeEdit, 1200);
    }
  }

  async function handleToggle(s: Service) {
    setPending(true);
    const result = await toggleServiceStatus(s.id, s.status);
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleDelete(s: Service) {
    if (!confirm(t.deleteConfirm)) return;
    setPending(true);
    const result = await deleteService(s.id);
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  if (services.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      </div>
    );
  }

  return (
    <>
      <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
        {services.map((s) => (
          <li key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-[var(--subtle)]">
                <span>{t.delivery} {s.delivery_days} {t.days}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(s.status)}`}
                >
                  {statusLabels[s.status as keyof typeof statusLabels] ?? s.status}
                </span>
              </p>
            </div>
            <p className="shrink-0 font-display font-bold">
              {(s.price_minor / 1).toLocaleString(locale === "en" ? "en-US" : "fr-FR")} FCFA
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => openEdit(s)}
                disabled={pending}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)] disabled:opacity-50"
              >
                {t.edit}
              </button>
              {(s.status === "active" || s.status === "paused") && (
                <button
                  onClick={() => handleToggle(s)}
                  disabled={pending}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)] disabled:opacity-50"
                >
                  {s.status === "active" ? t.pause : t.activate}
                </button>
              )}
              {(s.status === "draft" || s.status === "paused") && (
                <button
                  onClick={() => handleDelete(s)}
                  disabled={pending}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                >
                  {t.delete}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--background)] p-6 shadow-2xl max-h-[90dvh]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t.editTitle}</h2>
              <button
                onClick={closeEdit}
                className="rounded-full p-1.5 text-[var(--subtle)] hover:text-[var(--foreground)]"
                aria-label="Fermer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={onEditSubmit} className="space-y-4">

              {/* ── Forfaits (en premier pour visibilité) ── */}
              <div className="rounded-xl bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold">{t.form.packages}</p>
                <p className="mb-3 mt-0.5 text-xs text-[var(--subtle)]">{t.form.packagesHint}</p>
                <div className="space-y-3">
                  {([t.form.pkgBasic, t.form.pkgStandard, t.form.pkgPremium] as const).map((tierLabel, i) => {
                    const slot = pkgSlots[i];
                    return (
                      <div key={i} className={`rounded-xl border ${slot.enabled ? "border-[var(--color-brand-300)] bg-[var(--background)]" : "border-[var(--border)] bg-[var(--background)]"} p-3`}>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={slot.enabled}
                            onChange={(e) => setPkgSlots((prev) => {
                              const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot];
                              next[i] = { ...next[i], enabled: e.target.checked };
                              return next;
                            })}
                            className="h-4 w-4 accent-[var(--color-brand-500)]"
                          />
                          <span className="text-sm font-semibold">{tierLabel}</span>
                          {slot.enabled && slot.price && (
                            <span className="ml-auto text-xs font-semibold text-[var(--color-brand-600)]">
                              {Number(slot.price).toLocaleString("fr-FR")} FCFA
                            </span>
                          )}
                        </label>
                        {slot.enabled && (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={slot.name}
                              onChange={(e) => setPkgSlots((prev) => { const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot]; next[i] = { ...next[i], name: e.target.value }; return next; })}
                              placeholder={t.form.pkgName}
                              maxLength={60}
                              className={inputClass}
                            />
                            <textarea
                              value={slot.description}
                              onChange={(e) => setPkgSlots((prev) => { const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot]; next[i] = { ...next[i], description: e.target.value }; return next; })}
                              placeholder={t.form.pkgDescPlaceholder}
                              maxLength={500}
                              rows={2}
                              className={inputClass}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="mb-1 text-[11px] text-[var(--subtle)]">Prix (FCFA)</p>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={slot.price}
                                  onChange={(e) => setPkgSlots((prev) => { const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot]; next[i] = { ...next[i], price: e.target.value }; return next; })}
                                  placeholder={t.form.pkgPrice}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] text-[var(--subtle)]">Délai (jours)</p>
                                <input
                                  type="number"
                                  min={1}
                                  max={365}
                                  value={slot.deliveryDays}
                                  onChange={(e) => setPkgSlots((prev) => { const next = [...prev] as [PackageSlot, PackageSlot, PackageSlot]; next[i] = { ...next[i], deliveryDays: e.target.value }; return next; })}
                                  placeholder={t.form.pkgDelivery}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cover */}
              <div>
                <p className="text-sm font-medium">{t.form.cover}</p>
                <input type="hidden" name="coverUrl" value={coverUrl ?? ""} />
                <input type="hidden" name="galleryUrls" value={galleryUrls.join(",")} />
                <input type="hidden" name="tags" value={tags.join(",")} />
                {coverPreview ? (
                  <div className="relative mt-1.5 aspect-[16/9] overflow-hidden rounded-xl bg-[var(--surface)]">
                    <Image src={coverPreview} alt="" fill className="object-cover" sizes="512px" unoptimized />
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
                {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
              </div>

              {/* Gallery */}
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
                        aria-label="Supprimer"
                      >
                        {t.form.galleryRemove}
                      </button>
                    </div>
                  ))}
                  {galleryUrls.length < 4 && (
                    <label className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)] ${galleryUploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {galleryUploading ? (
                        <span className="text-[10px] font-semibold">{t.form.galleryUploading}</span>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-[10px] font-medium text-center leading-tight px-1">{t.form.galleryAdd}</span>
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
                {galleryError && <p className="mt-1 text-xs text-red-600">{galleryError}</p>}
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

              <div>
                <label htmlFor="edit-title" className="text-sm font-medium">{t.form.title}</label>
                <input
                  id="edit-title"
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={editing.title}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-category" className="text-sm font-medium">{t.form.category}</label>
                <select
                  id="edit-category"
                  name="categoryId"
                  required
                  defaultValue={editing.category_id ?? ""}
                  className={inputClass}
                >
                  <option value="" disabled>{t.form.choose}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-description" className="text-sm font-medium">{t.form.description}</label>
                <textarea
                  id="edit-description"
                  name="description"
                  required
                  minLength={30}
                  maxLength={3000}
                  rows={5}
                  defaultValue={editing.description ?? ""}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-price" className="text-sm font-medium">{t.form.price}</label>
                  <input
                    id="edit-price"
                    name="price"
                    required
                    inputMode="numeric"
                    pattern="[0-9 ]+"
                    defaultValue={String(editing.price_minor)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-delivery" className="text-sm font-medium">{t.form.delivery}</label>
                  <input
                    id="edit-delivery"
                    name="deliveryDays"
                    type="number"
                    min={1}
                    max={365}
                    required
                    defaultValue={editing.delivery_days}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
              {success && (
                <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">{success}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium transition-colors hover:border-[var(--color-brand-400)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending || uploading}
                  className="flex-1 rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pending ? t.editing : t.editSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
