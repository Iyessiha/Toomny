import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { visitorLocale } from "@/i18n/server-locale";
import { getCatalogTexts } from "@/i18n/catalog";

export const dynamic = "force-dynamic";

const MAX_PROVIDERS = 200;

export async function generateMetadata(): Promise<Metadata> {
  const t = getCatalogTexts(await visitorLocale());
  return {
    title: t.providersPageTitle,
    description: t.providersPageSubtitle,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"}/prestataires` },
  };
}

type Row = {
  id: string;
  name: string;
  verified: boolean;
  country: string | null;
  avatar: string | null;
  headline: string | null;
  city: string | null;
  skills: string;
  rating: number | null;
  ratingCount: number;
  received: number;
  services: number;
};

/** Mots de la recherche, normalisés : insensibles à la casse et aux accents. */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Prestataires visibles : ceux qui ont au moins une prestation publiée. Les photos
 * d'abord, puis les mieux notés et ceux qui ont le plus de commandes reçues.
 */
export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  const { q: rawQ = "" } = await searchParams;
  const query = normalize(rawQ.trim().slice(0, 80));

  const supabase = await createClient();
  const { data: active } = await supabase.from("services").select("provider_id").eq("status", "active").limit(2000);
  const ids = [...new Set((active ?? []).map((s) => s.provider_id as string))].slice(0, MAX_PROVIDERS);

  const [dirs, profs, stats, counts] = await Promise.all([
    ids.length ? supabase.from("provider_directory").select("id, display_name, country_code, verification_status").in("id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("provider_profiles").select("profile_id, avatar_url, headline, city, skills, rating_avg, rating_count").in("profile_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("provider_order_stats").select("provider_id, orders_received").in("provider_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("services").select("provider_id").eq("status", "active").in("provider_id", ids) : Promise.resolve({ data: [] }),
  ]);

  const dirById = new Map((dirs.data ?? []).map((d) => [d.id as string, d]));
  const profById = new Map((profs.data ?? []).map((p) => [p.profile_id as string, p]));
  const statById = new Map((stats.data ?? []).map((s) => [s.provider_id as string, Number(s.orders_received ?? 0)]));
  const countById = new Map<string, number>();
  for (const row of counts.data ?? []) {
    const id = row.provider_id as string;
    countById.set(id, (countById.get(id) ?? 0) + 1);
  }

  let rows: Row[] = ids
    .map((id): Row | null => {
      const d = dirById.get(id);
      if (!d) return null;
      const p = profById.get(id);
      return {
        id,
        name: (d.display_name as string | null) ?? t.detailProvider,
        verified: d.verification_status === "verified",
        country: (d.country_code as string | null) ?? null,
        avatar: (p?.avatar_url as string | null) ?? null,
        headline: (p?.headline as string | null) ?? null,
        city: (p?.city as string | null) ?? null,
        skills: (p?.skills as string | null) ?? "",
        rating: p?.rating_avg ? Number(p.rating_avg) : null,
        ratingCount: Number(p?.rating_count ?? 0),
        received: statById.get(id) ?? 0,
        services: countById.get(id) ?? 0,
      };
    })
    .filter((r): r is Row => r !== null);

  if (query) {
    rows = rows.filter((r) =>
      normalize([r.name, r.headline ?? "", r.city ?? "", r.skills].join(" ")).includes(query),
    );
  }

  rows.sort((a, b) => {
    if (Boolean(a.avatar) !== Boolean(b.avatar)) return a.avatar ? -1 : 1;
    if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
    return b.received - a.received;
  });

  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.providersPageTitle}</h1>
          <p className="mt-2 max-w-2xl text-[var(--subtle)]">{t.providersPageSubtitle}</p>
        </header>

        <form action="/prestataires" method="get" className="mb-8 flex gap-2">
          <input
            name="q"
            defaultValue={rawQ}
            placeholder={t.providersSearchPlaceholder}
            aria-label={t.providersSearchPlaceholder}
            className="input flex-1"
          />
          <button type="submit" className="btn-primary">{t.providersSearchButton}</button>
        </form>

        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--subtle)]">
            {query ? t.providersNoResult : t.providersEmpty}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const initials = r.name.slice(0, 2).toUpperCase();
              return (
                <li key={r.id}>
                  <Link
                    href={`/prestataires/${r.id}`}
                    className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      {r.avatar ? (
                        <Image src={r.avatar} alt={r.name} width={64} height={64} className="h-16 w-16 rounded-2xl object-cover" />
                      ) : (
                        <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-lg font-extrabold text-white">
                          {initials}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-bold">
                          {r.name}
                          {r.verified && (
                            <span title={t.identityVerified} className="rounded-full bg-[var(--color-brand-500)] px-2 py-0.5 text-[10px] font-bold text-white">✓</span>
                          )}
                        </p>
                        <p className="truncate text-sm text-[var(--subtle)]">{r.headline ?? [r.city, r.country].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                    <dl className="mt-auto grid grid-cols-3 gap-2 text-center">
                      <div>
                        <dt className="text-[11px] text-[var(--subtle)]">{t.rating}</dt>
                        <dd className="font-display font-extrabold">{r.rating !== null ? `★ ${r.rating.toFixed(1)}` : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-[var(--subtle)]">{t.ordersReceived}</dt>
                        <dd className="font-display font-extrabold">{r.received}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-[var(--subtle)]">{t.services}</dt>
                        <dd className="font-display font-extrabold">{r.services}</dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer locale={locale} />
    </>
  );
}
