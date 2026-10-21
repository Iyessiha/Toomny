"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CoverNotLandscapeError, resizeCover } from "@/lib/resize-image";

export type ServicePhotosTexts = {
  replaceCover: string;
  addPhoto: string;
  removePhoto: string;
  uploading: string;
  photoError: string;
  galleryFull: string;
  coverNotLandscape: string;
  noCover: string;
  noGallery: string;
  openImage: string;
  galleryLabel: string;
};

export function ServicePhotosForm({
  serviceId,
  title,
  coverUrl,
  galleryUrls,
  texts,
}: {
  serviceId: string;
  title: string;
  coverUrl: string | null;
  galleryUrls: string[];
  texts: ServicePhotosTexts;
}) {
  const router = useRouter();
  const [cover, setCover] = useState<string | null>(coverUrl);
  const [gallery, setGallery] = useState<string[]>(galleryUrls);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(data: FormData): Promise<Record<string, unknown> | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/photos`, { method: "POST", body: data });
      const json = (await res.json()) as Record<string, unknown> & { error?: string };
      if (!res.ok) {
        setError(json.error === "gallery_full" ? texts.galleryFull : texts.photoError);
        return null;
      }
      router.refresh();
      return json;
    } catch {
      setError(texts.photoError);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    e.target.value = "";
    if (!raw) return;
    let file: File;
    try {
      file = await resizeCover(raw);
    } catch (err) {
      setError(err instanceof CoverNotLandscapeError ? texts.coverNotLandscape : texts.photoError);
      return;
    }
    const fd = new FormData();
    fd.append("action", "cover");
    fd.append("file", file);
    const json = await send(fd);
    if (json?.coverUrl) setCover(json.coverUrl as string);
  }

  async function onGalleryAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("action", "gallery-add");
    fd.append("file", file);
    const json = await send(fd);
    if (json?.galleryUrls) setGallery(json.galleryUrls as string[]);
  }

  async function onRemove(url: string) {
    const fd = new FormData();
    fd.append("action", "gallery-remove");
    fd.append("url", url);
    const json = await send(fd);
    if (json?.galleryUrls) setGallery(json.galleryUrls as string[]);
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-[var(--tone-danger-fg)]">{error}</p>}

      {/* Couverture */}
      <div className="space-y-3">
        {cover ? (
          <a href={cover} target="_blank" rel="noopener noreferrer" aria-label={texts.openImage} className="relative block aspect-video overflow-hidden rounded-xl bg-[var(--surface)]">
            <Image src={cover} alt={title} fill className="object-contain" sizes="(min-width: 1024px) 800px, 100vw" />
          </a>
        ) : (
          <p className="text-sm text-[var(--tone-danger-fg)]">{texts.noCover}</p>
        )}
        <label className={`btn-ghost btn-sm inline-flex cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? texts.uploading : texts.replaceCover}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCover} disabled={busy} />
        </label>
      </div>

      {/* Galerie */}
      <div className="space-y-3">
        <p className="text-sm text-[var(--subtle)]">{texts.galleryLabel} ({gallery.length}/4)</p>
        {gallery.length === 0 ? (
          <p className="text-sm text-[var(--subtle)]">{texts.noGallery}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((url, i) => (
              <div key={url} className="space-y-2">
                <a href={url} target="_blank" rel="noopener noreferrer" aria-label={texts.openImage} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-[var(--surface)]">
                  <Image src={url} alt={`${title} — ${i + 2}`} fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
                </a>
                <button type="button" onClick={() => onRemove(url)} disabled={busy} className="btn-danger btn-sm w-full">
                  {texts.removePhoto}
                </button>
              </div>
            ))}
          </div>
        )}
        {gallery.length < 4 && (
          <label className={`btn-ghost btn-sm inline-flex cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
            {busy ? texts.uploading : texts.addPhoto}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onGalleryAdd} disabled={busy} />
          </label>
        )}
      </div>
    </div>
  );
}
