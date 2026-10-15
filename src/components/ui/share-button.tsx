"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  title: string;
  text?: string;
  /** URL à partager — par défaut window.location.href */
  url?: string;
  locale?: "fr" | "en";
  size?: "sm" | "md";
};

const LABELS = {
  fr: {
    share: "Partager",
    copy: "Copier le lien",
    copied: "Lien copié !",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    x: "X (Twitter)",
  },
  en: {
    share: "Share",
    copy: "Copy link",
    copied: "Link copied!",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    x: "X (Twitter)",
  },
};

export function ShareButton({ title, text, url, locale = "fr", size = "md" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const l = LABELS[locale];

  const getUrl = () => url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleNativeShare = useCallback(async () => {
    const shareUrl = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url: shareUrl });
        return;
      } catch {
        // user cancelled or not supported — fall through to dropdown
      }
    }
    setOpen((v) => !v);
  }, [title, text, url]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 2000);
    } catch {
      // noop
    }
  }, [url]);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fermer à Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const shareUrl = getUrl();
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const options = [
    {
      key: "copy",
      label: copied ? l.copied : l.copy,
      icon: copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 13 4 4L19 7" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
      ),
      action: handleCopy,
      color: copied ? "text-[var(--color-brand-600)]" : "",
    },
    {
      key: "whatsapp",
      label: l.whatsapp,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M11.5 2a9.5 9.5 0 0 0-8.3 14.1L2 22l6.1-1.2A9.5 9.5 0 1 0 11.5 2z"/>
        </svg>
      ),
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "text-[#25D366]",
    },
    {
      key: "facebook",
      label: l.facebook,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.883v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "text-[#1877F2]",
    },
    {
      key: "x",
      label: l.x,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "text-[var(--foreground)]",
    },
  ];

  const btnClass = size === "sm"
    ? "flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--subtle)] shadow-sm transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
    : "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm font-medium text-[var(--subtle)] shadow-sm transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]";

  return (
    <div ref={ref} className="relative">
      <button onClick={handleNativeShare} aria-label={l.share} className={btnClass}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        {size === "md" && <span>{l.share}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-xl shadow-black/10">
          {options.map((opt) =>
            opt.action ? (
              <button
                key={opt.key}
                onClick={opt.action}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface)] ${opt.color}`}
              >
                <span className="shrink-0">{opt.icon}</span>
                {opt.label}
              </button>
            ) : (
              <a
                key={opt.key}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface)] ${opt.color}`}
              >
                <span className="shrink-0">{opt.icon}</span>
                {opt.label}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
