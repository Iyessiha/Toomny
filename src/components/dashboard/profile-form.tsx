"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { saveProviderProfile } from "@/app/(fr)/dashboard/profil/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]";

export function ProfileForm({
  defaults,
  publicPath,
  locale = "fr",
}: {
  defaults: {
    headline: string;
    bio: string;
    city: string;
    contentLocale: string;
    avatarUrl: string | null;
    skills: string | null;
  };
  publicPath: string;
  locale?: Locale;
}) {
  const t = getDashboardTexts(locale);
  const p = t.profile;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(defaults.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaults.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUrl(null);
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? p.avatarError);
        setAvatarPreview(defaults.avatarUrl);
      } else {
        setAvatarUrl(data.url);
      }
    } catch {
      setUploadError(p.avatarError);
      setAvatarPreview(defaults.avatarUrl);
    } finally {
      setUploading(false);
    }
  }

  function removeAvatar() {
    setAvatarUrl(null);
    setAvatarPreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading) return;
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await saveProviderProfile(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Avatar */}
      <div>
        <p className="text-sm font-medium">{p.avatar}</p>
        <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
        <div className="mt-2 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--surface)] border border-[var(--border)]">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="" fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl text-[var(--subtle)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </span>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <span className="text-[10px] font-semibold text-white">{p.avatarUploading}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]">
              {p.avatarUpload}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {avatarPreview && !uploading && (
              <button
                type="button"
                onClick={removeAvatar}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--subtle)] transition-colors hover:border-red-300 hover:text-red-600"
              >
                {p.avatarRemove}
              </button>
            )}
            <p className="text-[11px] text-[var(--subtle)]">{p.avatarHint}</p>
          </div>
        </div>
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
      </div>

      <div>
        <label htmlFor="headline" className="text-sm font-medium">{p.headline}</label>
        <input
          id="headline"
          name="headline"
          maxLength={120}
          defaultValue={defaults.headline}
          placeholder={p.headlinePlaceholder}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium">{p.bio}</label>
        <textarea
          id="bio"
          name="bio"
          maxLength={2000}
          rows={6}
          defaultValue={defaults.bio}
          placeholder={p.bioPlaceholder}
          className={inputClass}
        />
      </div>

      {/* Compétences */}
      <SkillsField
        label={p.skills}
        placeholder={p.skillsPlaceholder}
        hint={p.skillsHint}
        initial={defaults.skills ?? ""}
        inputClass={inputClass}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className="text-sm font-medium">{p.city}</label>
          <input id="city" name="city" maxLength={80} defaultValue={defaults.city} className={inputClass} />
        </div>
        <div>
          <label htmlFor="contentLocale" className="text-sm font-medium">{p.language}</label>
          <select id="contentLocale" name="contentLocale" defaultValue={defaults.contentLocale} className={inputClass}>
            <option value="fr">{p.french}</option>
            <option value="en">{p.english}</option>
          </select>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && (
        <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">
          {p.saved}{" "}
          <Link href={publicPath} className="underline">{p.viewPublic}</Link>
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? t.common.saving : t.common.save}
      </button>
    </form>
  );
}

function SkillsField({
  label,
  placeholder,
  hint,
  initial,
  inputClass: cls,
}: {
  label: string;
  placeholder: string;
  hint: string;
  initial: string;
  inputClass: string;
}) {
  const [raw, setRaw] = useState(initial);
  const tags = raw.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div>
      <label htmlFor="skills" className="text-sm font-medium">{label}</label>
      <input
        id="skills"
        name="skills"
        maxLength={500}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={placeholder}
        className={cls}
      />
      <p className="mt-1 text-[11px] text-[var(--subtle)]">{hint}</p>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-[12px] font-medium text-[var(--color-brand-700)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
