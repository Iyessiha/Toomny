"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ServiceCard } from "@/components/catalog/service-card";
import { fetchWishlistServices } from "@/app/(fr)/dashboard/favoris/actions";
import type { ServiceCard as ServiceCardData } from "@/lib/catalog";
import type { Locale } from "@/i18n/dictionaries";

const KEY = "toomny_wishlist";
const EVENT = "toomny:wishlist-change";

function snapshot() {
  try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; }
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVENT, cb); };
}
function readIds(raw: string): string[] {
  try {
    const p: unknown = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

export function WishlistGrid({
  locale,
  texts,
}: {
  locale: Locale;
  texts: { empty: string; emptyHint: string; browseCta: string; loading: string };
}) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const ids = readIds(raw);

  const [services, setServices] = useState<ServiceCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setServices([]); setLoading(false); return; }
    setLoading(true);
    fetchWishlistServices(ids).then((data) => {
      setServices(data);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
    );
  }

  if (ids.length === 0 || services.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-4xl" aria-hidden>🤍</span>
        <p className="font-semibold">{texts.empty}</p>
        <p className="max-w-xs text-sm text-[var(--subtle)]">{texts.emptyHint}</p>
        <Link
          href="/services"
          className="mt-2 rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)] transition-colors"
        >
          {texts.browseCta}
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <li key={s.id}>
          <ServiceCard service={s} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
